"""
Database Session and Engine Management Module.
Supports MySQL (Production) and SQLite (Development Fallback).
"""

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
from app.core.app_logging import logger

# Configure database connect arguments based on driver
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Create SQLAlchemy engine with connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,
)

# Create SessionLocal factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base ORM Class
Base = declarative_base()


def get_db() -> Generator:
    """
    FastAPI dependency yielding database session per request.
    Ensures safe closing and automatic rollback on unhandled exceptions.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session exception encountered: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()
