"""
Secure File Sharing REST API Endpoints.
Provides endpoints for uploading encrypted files, retrieving file metadata, and downloading verified decrypted files.
"""

from typing import List
from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile, Form, Request, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.file import FileUploadResponse, FileMetadataResponse
from app.services.file_service import FileService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/files", tags=["Secure File Sharing"])


@router.post("/upload", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_encrypted_file(
    request: Request,
    recipient_id: str = Form(..., description="Recipient user UUID"),
    session_key: str = Form(..., description="Base64 AES-256 Session Key"),
    file: UploadFile = FastAPIFile(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Encrypts uploaded file payload using AES-256-GCM, verifies SHA-256 digest,
    stores ciphertext on disk, and records audit trail.
    """
    ip_addr = request.client.host if request.client else "unknown"
    return FileService.encrypt_and_store_file(
        db=db,
        uploader_id=current_user.id,
        recipient_id=recipient_id,
        file=file,
        session_key_b64=session_key,
        ip_address=ip_addr
    )


@router.get("", response_model=List[FileMetadataResponse])
@router.get("/", response_model=List[FileMetadataResponse])
def list_files(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns list of files uploaded by or shared with the authenticated user.
    """
    return FileService.list_accessible_files(db=db, user_id=current_user.id)


@router.post("/{file_id}/download")
def download_decrypted_file(
    file_id: str,
    request: Request,
    session_key: str = Form(..., description="Base64 AES-256 Session Key"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves ciphertext from disk, decrypts using session key, validates SHA-256 hash digest,
    and returns original file binary stream.
    """
    ip_addr = request.client.host if request.client else "unknown"
    file_bytes, file_meta = FileService.retrieve_and_decrypt_file(
        db=db,
        file_id=file_id,
        requesting_user_id=current_user.id,
        session_key_b64=session_key,
        ip_address=ip_addr
    )

    return Response(
        content=file_bytes,
        media_type=file_meta.mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="{file_meta.original_filename}"',
            "X-SHA256-Checksum": file_meta.file_hash,
            "X-File-Size": str(file_meta.file_size)
        }
    )
