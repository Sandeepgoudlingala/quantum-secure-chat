"""
Backwards-compatibility re-export.
The actual logging module has been moved to app_logging.py to avoid
shadowing Python's stdlib 'logging' module.
"""
from app.core.app_logging import logger

__all__ = ["logger"]
