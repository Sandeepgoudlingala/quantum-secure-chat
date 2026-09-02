"""
System Configuration Module using Pydantic Settings.
Enforces type safety, environment variable parsing, and cryptographic parameters.
"""

import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application Info
    PROJECT_NAME: str = "Hybrid PQC Communication System"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Security & Cryptography
    SECRET_KEY: str = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ML_KEM_PARAMETER_SET: str = "ML-KEM-768"

    # Database Settings
    DATABASE_URL: str = "sqlite:///./pqc_app.db"
    MYSQL_SERVER: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_USER: str = "pqc_user"
    MYSQL_PASSWORD: str = "pqc_secure_password"
    MYSQL_DB: str = "pqc_capstone_db"

    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://quantum-secure-chat-theta.vercel.app",
    ]
    CORS_ORIGIN_REGEX: str = r"^https:\/\/.*\.vercel\.app$"


    # File Storage Settings
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 50

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: str = "100/minute"
    AUTH_RATE_LIMIT_PER_MINUTE: str = "5/minute"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(f"Invalid CORS configuration format: {v}")

    def get_upload_path(self) -> str:
        """Returns the absolute upload path, creating the directory if missing."""
        abs_path = os.path.abspath(self.UPLOAD_DIR)
        os.makedirs(abs_path, exist_ok=True)
        return abs_path


# Global instance of application settings
settings = Settings()
