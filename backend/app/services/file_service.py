"""
Secure Encrypted File Sharing Service Module.
Encrypts uploaded files using AES-256-GCM, stores ciphertexts on disk, enforces access control,
and verifies SHA-256 data integrity upon download.
"""

import os
import uuid
from typing import List, Tuple
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
from app.models.file import File
from app.crypto.aes_gcm import AES256GCMEngine
from app.core.config import settings
from app.services.audit_service import AuditService
from app.core.exceptions import ResourceNotFoundException, PermissionDeniedException, DecryptionFailedException
from app.core.app_logging import logger


class FileService:

    @staticmethod
    def encrypt_and_store_file(
        db: Session,
        uploader_id: str,
        recipient_id: str,
        file: UploadFile,
        session_key_b64: str,
        ip_address: str = None
    ) -> File:
        """
        Reads file bytes, computes SHA-256 hash digest, encrypts using AES-256-GCM,
        persists encrypted binary payload to disk storage, and records database metadata.
        """
        # Read raw file bytes
        raw_bytes = file.file.read()
        file_size = len(raw_bytes)

        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if file_size > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed limit of {settings.MAX_FILE_SIZE_MB}MB"
            )

        # Decode 256-bit AES session key
        session_key = AES256GCMEngine.b64_decode(session_key_b64)

        # 1. Compute SHA-256 hash digest of plaintext file
        sha256_digest = AES256GCMEngine.compute_sha256_digest(raw_bytes)

        # 2. AES-256-GCM Encrypt File
        ciphertext, iv, auth_tag = AES256GCMEngine.encrypt(raw_bytes, session_key)

        # 3. Store Encrypted Payload on Disk
        file_uuid = str(uuid.uuid4())
        upload_folder = settings.get_upload_path()
        storage_filename = f"{file_uuid}.enc"
        storage_path = os.path.join(upload_folder, storage_filename)

        with open(storage_path, "wb") as f:
            f.write(ciphertext)

        # 4. Save metadata to MySQL
        file_record = File(
            id=file_uuid,
            uploader_id=uploader_id,
            recipient_id=recipient_id,
            original_filename=file.filename or "unknown_file",
            storage_path=storage_path,
            file_size=file_size,
            mime_type=file.content_type or "application/octet-stream",
            file_hash=sha256_digest,
            iv=AES256GCMEngine.b64_encode(iv),
            auth_tag=AES256GCMEngine.b64_encode(auth_tag)
        )

        db.add(file_record)
        db.commit()
        db.refresh(file_record)

        # 5. Audit Log File Upload Event
        AuditService.log_event(
            db=db,
            event_type="FILE_UPLOADED",
            user_id=uploader_id,
            ip_address=ip_address,
            details={
                "file_id": file_record.id,
                "filename": file_record.original_filename,
                "size_bytes": file_size,
                "sha256_hash": sha256_digest
            }
        )

        logger.info(f"Encrypted File uploaded: ID {file_record.id} stored at {storage_path}")
        return file_record

    @staticmethod
    def retrieve_and_decrypt_file(
        db: Session,
        file_id: str,
        requesting_user_id: str,
        session_key_b64: str,
        ip_address: str = None
    ) -> Tuple[bytes, File]:
        """
        Reads encrypted file ciphertext from disk, decrypts using AES-256-GCM session key,
        and verifies SHA-256 integrity hash against original digest before returning plaintext bytes.
        """
        file_record = db.query(File).filter(File.id == file_id).first()
        if not file_record:
            raise ResourceNotFoundException(detail=f"File ID '{file_id}' not found")

        # Access Control Check: Only uploader or recipient can download
        if requesting_user_id not in [file_record.uploader_id, file_record.recipient_id]:
            raise PermissionDeniedException(detail="You do not have authorization to access this file")

        if not os.path.exists(file_record.storage_path):
            raise ResourceNotFoundException(detail="Encrypted storage file payload missing on server")

        # Read encrypted bytes from disk
        with open(file_record.storage_path, "rb") as f:
            ciphertext_bytes = f.read()

        session_key = AES256GCMEngine.b64_decode(session_key_b64)
        iv_bytes = AES256GCMEngine.b64_decode(file_record.iv)
        auth_tag_bytes = AES256GCMEngine.b64_decode(file_record.auth_tag)

        # Decrypt file payload
        decrypted_bytes = AES256GCMEngine.decrypt(
            ciphertext=ciphertext_bytes,
            key=session_key,
            iv=iv_bytes,
            auth_tag=auth_tag_bytes
        )

        # Integrity Check: Compare SHA-256 hash digest
        downloaded_hash = AES256GCMEngine.compute_sha256_digest(decrypted_bytes)
        if downloaded_hash != file_record.file_hash:
            logger.error(f"SHA-256 Integrity Verification Mismatch for File ID {file_id}")
            raise DecryptionFailedException("File integrity check failed! File content has been modified or corrupted.")

        # Audit Log Download Event
        AuditService.log_event(
            db=db,
            event_type="FILE_DOWNLOADED",
            user_id=requesting_user_id,
            ip_address=ip_address,
            details={"file_id": file_id, "filename": file_record.original_filename}
        )

        return decrypted_bytes, file_record

    @staticmethod
    def list_accessible_files(db: Session, user_id: str) -> List[File]:
        """Lists all encrypted files uploaded by or shared with user."""
        return db.query(File).filter(
            (File.uploader_id == user_id) | (File.recipient_id == user_id)
        ).order_by(File.created_at.desc()).all()
