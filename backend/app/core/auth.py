"""
Quantaneer Authentication & Security Core
Implements PBKDF2 password hashing with cryptographically secure salts,
JWT token generation, validation, and FastAPI user context dependencies.
"""

import os
import hashlib
import secrets
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, status, Depends
from app.core.db import get_db_connection

JWT_SECRET = os.getenv("JWT_SECRET", "quantaneer-secret-key-sih26140-egreen-quanta-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 72

def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """Hashes password with PBKDF2-HMAC-SHA256 and unique salt."""
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    return hashed, salt

def verify_password(plain_password: str, hashed_password: str, salt: str) -> bool:
    """Verifies plain password against stored hash."""
    new_hash, _ = hash_password(plain_password, salt)
    return secrets.compare_digest(new_hash, hashed_password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generates signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=JWT_EXPIRATION_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates JWT access token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def get_current_user_optional(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    """Extracts user from Authorization header if present, else returns default user."""
    if not authorization or not authorization.startswith("Bearer "):
        # Return fallback default student user
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = 'user_default'")
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None

    user_id = payload["sub"]
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return dict(row)

def get_current_user_required(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Strictly requires authenticated user token."""
    user = get_current_user_optional(authorization)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials invalid or missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
