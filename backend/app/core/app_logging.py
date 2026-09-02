"""
Structured Centralized Logging System.
Provides formatted loggers for audit logging, application errors, and security events.
"""

import sys
import logging


def setup_logging() -> logging.Logger:
    """Configures system-wide logging with standard formats."""
    # Import settings here to avoid circular import at module load time
    from app.core.config import settings

    logger = logging.getLogger("pqc_system")
    logger.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)

    if not logger.handlers:
        formatter = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] [%(name)s:%(lineno)d] - %(message)s"
        )

        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

    return logger


logger = setup_logging()
