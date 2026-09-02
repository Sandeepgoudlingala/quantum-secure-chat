"""
Rate Limiting Infrastructure using SlowAPI.
Protects sensitive endpoints (e.g. login, register, key exchange) from brute-force and DoS attacks.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"]
)
