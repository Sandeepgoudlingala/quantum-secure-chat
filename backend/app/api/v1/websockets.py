"""
Real-Time WebSocket Connection Manager & Endpoint Handler.
Supports real-time encrypted messaging, online user presence, typing indicators, read receipts, and PQC handshakes.
"""

import json
from typing import Dict, List, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import decode_token
from app.models.user import User
from app.services.chat_service import ChatService
from app.core.app_logging import logger


class ConnectionManager:
    """
    Manages active WebSocket connections per authenticated user ID.
    """

    def __init__(self):
        # Maps user_id -> Set of active WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        """Accepts WebSocket connection and tracks socket mapping."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.info(f"WebSocket client connected: User {user_id}")

    def disconnect(self, user_id: str, websocket: WebSocket):
        """Removes WebSocket connection and cleans map."""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"WebSocket client disconnected: User {user_id}")

    async def send_personal_json(self, user_id: str, data: dict) -> bool:
        """Sends a JSON message to all active sockets of a specific user."""
        if user_id in self.active_connections:
            sockets = list(self.active_connections[user_id])
            for ws in sockets:
                try:
                    await ws.send_json(data)
                except Exception as e:
                    logger.error(f"Error sending WS message to user {user_id}: {str(e)}")
                    self.disconnect(user_id, ws)
            return True
        return False

    async def broadcast(self, data: dict, exclude_user_id: str = None):
        """Broadcasts a JSON message to all connected clients."""
        for user_id, sockets in list(self.active_connections.items()):
            if exclude_user_id and user_id == exclude_user_id:
                continue
            for ws in list(sockets):
                try:
                    await ws.send_json(data)
                except Exception as e:
                    logger.error(f"Broadcast error for user {user_id}: {str(e)}")


manager = ConnectionManager()
ws_router = APIRouter(prefix="/ws", tags=["WebSocket Real-Time Chat"])


@ws_router.websocket("/chat")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT Access Token")
):
    """
    WebSocket endpoint for real-time encrypted chat communication.
    Requires token query parameter authentication.
    """
    db: Session = SessionLocal()
    user_id = None

    try:
        # Authenticate Token
        try:
            payload = decode_token(token)
        except Exception:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        if payload.get("type") != "access":
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Connect user socket
        await manager.connect(user_id, websocket)

        # Update online status in database
        user.is_online = True
        db.commit()

        # Broadcast Presence update to all users
        await manager.broadcast({
            "event_type": "USER_PRESENCE",
            "payload": {"user_id": user_id, "username": user.username, "is_online": True}
        })

        # Main Event Receiver Loop
        while True:
            raw_data = await websocket.receive_text()
            data = json.loads(raw_data)
            event_type = data.get("event_type")
            payload_data = data.get("payload", {})

            if event_type == "SEND_MESSAGE":
                # Handle Encrypted Message Delivery
                receiver_id = payload_data.get("receiver_id")
                encrypted_content = payload_data.get("encrypted_content")
                iv = payload_data.get("iv")
                auth_tag = payload_data.get("auth_tag")

                # Save message to database
                msg = ChatService.save_encrypted_message(
                    db=db,
                    sender_id=user_id,
                    receiver_id=receiver_id,
                    encrypted_content=encrypted_content,
                    iv=iv,
                    auth_tag=auth_tag
                )

                msg_payload = {
                    "event_type": "NEW_MESSAGE",
                    "payload": {
                        "id": msg.id,
                        "sender_id": user_id,
                        "receiver_id": receiver_id,
                        "encrypted_content": encrypted_content,
                        "iv": iv,
                        "auth_tag": auth_tag,
                        "status": msg.status,
                        "created_at": msg.created_at.isoformat()
                    }
                }

                # Dispatch message to recipient if online
                delivered = await manager.send_personal_json(receiver_id, msg_payload)
                if delivered:
                    ChatService.update_message_status(db, msg.id, "DELIVERED")

                # Send confirmation receipt to sender
                await manager.send_personal_json(user_id, {
                    "event_type": "MESSAGE_SENT_ACK",
                    "payload": {"message_id": msg.id, "status": "DELIVERED" if delivered else "SENT"}
                })

            elif event_type in ["TYPING_START", "TYPING_STOP"]:
                recipient_id = payload_data.get("recipient_id")
                await manager.send_personal_json(recipient_id, {
                    "event_type": event_type,
                    "payload": {"sender_id": user_id}
                })

            elif event_type == "READ_RECEIPT":
                message_id = payload_data.get("message_id")
                sender_id = payload_data.get("sender_id")
                ChatService.update_message_status(db, message_id, "READ")
                await manager.send_personal_json(sender_id, {
                    "event_type": "READ_RECEIPT",
                    "payload": {"message_id": message_id, "status": "READ"}
                })

            elif event_type in ["PQC_HANDSHAKE_SIGNAL", "PQC_SESSION_ROTATE", "PQC_SESSION_END"]:
                recipient_id = payload_data.get("recipient_id")
                if event_type in ["PQC_SESSION_ROTATE", "PQC_SESSION_END"] and recipient_id:
                    # Delete conversation from BOTH sides (both directions of sender/receiver)
                    ChatService.delete_conversation_history(db, user_id, recipient_id)
                    ChatService.delete_conversation_history(db, recipient_id, user_id)
                await manager.send_personal_json(recipient_id, {
                    "event_type": event_type,
                    "payload": {
                        "sender_id": user_id,
                        "kem_ciphertext": payload_data.get("kem_ciphertext")
                    }
                })

            elif event_type in ["SHARE_SESSION_KEY", "REQUEST_SESSION_KEY"]:
                recipient_id = payload_data.get("recipient_id")
                await manager.send_personal_json(recipient_id, {
                    "event_type": event_type,
                    "payload": {
                        "sender_id": user_id,
                        "username": user.username,
                        "session_key": payload_data.get("session_key")
                    }
                })


    except WebSocketDisconnect:
        if user_id:
            manager.disconnect(user_id, websocket)
            # Update user online status
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.is_online = False
                db.commit()

            await manager.broadcast({
                "event_type": "USER_PRESENCE",
                "payload": {"user_id": user_id, "is_online": False}
            })
    except Exception as e:
        logger.error(f"WebSocket Exception encountered: {str(e)}")
        if user_id:
            manager.disconnect(user_id, websocket)
    finally:
        db.close()
