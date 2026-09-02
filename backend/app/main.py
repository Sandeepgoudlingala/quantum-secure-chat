"""
FastAPI Application Primary Entrypoint.
Initializes middleware, security headers, rate limiters, database tables, and API routes.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import Base, engine
from app.core.app_logging import logger
from app.core.rate_limiter import limiter
from app.core.exceptions import PQCSystemException
from app.api.v1.router import api_router
from app.api.v1.websockets import ws_router
import app.models  # noqa: F401 — Ensure all ORM models register with Base.metadata before create_all()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle event handler for application startup and shutdown.
    Ensures storage paths exist and database schemas are initialized.
    """
    logger.info("Initializing Hybrid PQC Communication System Backend...")
    # Create upload storage directory
    settings.get_upload_path()

    # Create tables if not exists
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified successfully.")

    yield

    logger.info("Shutting down Hybrid PQC Communication System Backend...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Production-Grade Hybrid Post-Quantum Cryptographic Communication System API (ML-KEM + AES-256-GCM)",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Attach SlowAPI Rate Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=getattr(settings, "CORS_ORIGIN_REGEX", r"^https:\/\/.*\.vercel\.app$"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """
    Custom Security Middleware applying OWASP Recommended HTTP Response Headers.
    """
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    if request.url.path in ["/docs", "/redoc", "/openapi.json"]:
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "img-src 'self' data: https://fastapi.tiangolo.com;"
        )
    else:
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; frame-ancestors 'none';"
    return response


@app.exception_handler(PQCSystemException)
async def pqc_exception_handler(request: Request, exc: PQCSystemException):
    """Global handler for domain-specific PQC exceptions."""
    logger.error(f"PQC Exception caught: {exc.message}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": exc.message, "error_type": exc.__class__.__name__},
    )


# Mount REST and WebSocket Routers
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(ws_router)


@app.get("/", tags=["Health"])
async def root():
    """Root health check endpoint."""
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": "1.0.0",
        "quantum_algorithm": settings.ML_KEM_PARAMETER_SET,
        "symmetric_algorithm": "AES-256-GCM",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """System health check endpoint."""
    return {"status": "healthy", "database": "connected"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
