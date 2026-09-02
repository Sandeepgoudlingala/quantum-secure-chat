import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useCrypto } from './CryptoContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const { receivePQCHandshakeSignal } = useCrypto();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [messages, setMessages] = useState({}); // recipientId -> list of messages
  const [typingUsers, setTypingUsers] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [sharedKeyOffer, setSharedKeyOffer] = useState(null); // { sender_id, username, session_key }
  const [keyRequest, setKeyRequest] = useState(null); // { sender_id, username }
  const wsRef = useRef(null);
  // Tracks peers whose key has been accepted this session — suppresses repeat banners
  const acceptedKeyPeers = useRef(new Set());
  // Expose a way for ChatPage to mark a peer's key as accepted
  const markKeyAccepted = (peerId) => {
    acceptedKeyPeers.current.add(peerId);
  };

  useEffect(() => {
    if (!user) {
      if (wsRef.current) {
        wsRef.current.close();
      }
      setIsConnected(false);
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const defaultWsHost = (window.location.hostname.includes('vercel.app') || window.location.hostname !== 'localhost')
      ? 'wss://quantum-secure-chat-6fvo.onrender.com'
      : `${protocol}//${window.location.host}`;
    const wsHost = import.meta.env.VITE_WS_URL || defaultWsHost;
    const wsUrl = `${wsHost}/ws/chat?token=${token}`;


    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected successfully');
      setIsConnected(true);
      setSocket(ws);
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        const { event_type, payload } = data;

        if (event_type === 'USER_PRESENCE') {
          setOnlineUsers((prev) => ({
            ...prev,
            [payload.user_id]: payload.is_online,
          }));
        } else if (event_type === 'NEW_MESSAGE') {
          const senderId = payload.sender_id;
          setMessages((prev) => ({
            ...prev,
            [senderId]: [...(prev[senderId] || []), payload],
          }));

          // Send read receipt if active chat window and socket is open
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                event_type: 'READ_RECEIPT',
                payload: { message_id: payload.id, sender_id: senderId },
              })
            );
          }
        } else if (event_type === 'TYPING_START') {
          setTypingUsers((prev) => ({ ...prev, [payload.sender_id]: true }));
        } else if (event_type === 'TYPING_STOP') {
          setTypingUsers((prev) => ({ ...prev, [payload.sender_id]: false }));
        } else if (event_type === 'PQC_HANDSHAKE_SIGNAL') {
          const { sender_id, kem_ciphertext } = payload;
          await receivePQCHandshakeSignal(sender_id, kem_ciphertext);
        } else if (event_type === 'SHARE_SESSION_KEY') {
          // Peer shared their session key — only show the banner the FIRST time
          if (acceptedKeyPeers.current.has(payload.sender_id)) {
            // Key already accepted once — silently dispatch an update event so ChatPage can auto-apply
            setSharedKeyOffer({ ...payload, silent: true });
          } else {
            setSharedKeyOffer(payload);
          }
        } else if (event_type === 'REQUEST_SESSION_KEY') {
          // Peer is requesting our session key
          setKeyRequest(payload);
        } else if (event_type === 'PQC_SESSION_END' || event_type === 'PQC_SESSION_ROTATE') {
          const senderId = payload.sender_id;
          setMessages((prev) => ({
            ...prev,
            [senderId]: [
              {
                id: `sys_end_${Date.now()}`,
                sender_id: senderId,
                is_system: true,
                is_session_end: true,
                plaintext: '🛡️ Session ended by peer. Conversation cleared on both sides for forward secrecy.',
                created_at: new Date().toISOString(),
              },
            ],
          }));
        }
      } catch (err) {
        console.error('Error handling WebSocket frame:', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
      setSocket(null);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user]);

  const sendWSMessage = (event_type, payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event_type, payload }));
    }
  };

  const clearPeerMessages = (peerId) => {
    if (!peerId) return;
    setMessages((prev) => ({
      ...prev,
      [peerId]: [],
    }));
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        messages,
        typingUsers,
        sharedKeyOffer,
        keyRequest,
        setSharedKeyOffer,
        setKeyRequest,
        sendWSMessage,
        setMessages,
        clearPeerMessages,
        markKeyAccepted,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () =>
  useContext(SocketContext) || {
    socket: null,
    isConnected: false,
    onlineUsers: {},
    messages: {},
    typingUsers: {},
    sharedKeyOffer: null,
    keyRequest: null,
    setSharedKeyOffer: () => {},
    setKeyRequest: () => {},
    sendWSMessage: () => {},
    setMessages: () => {},
    clearPeerMessages: () => {},
    markKeyAccepted: () => {},
  };

