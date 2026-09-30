"""
FastAPI Routes for Authentication & User Session Management
Supports registration, login with JWT bearer tokens, profile retrieval,
and persistent multi-user progress synchronization.
"""

import uuid
from fastapi import APIRouter, HTTPException, status, Depends, Header
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from app.core.db import get_db_connection
from app.core.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user_optional,
    get_current_user_required
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    email: str = Field(min_length=3, max_length=120)
    password: str = Field(min_length=6)
    role: str = Field(default="student") # "student" or "instructor"

class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=120)
    password: str

class UpdateProgressRequest(BaseModel):
    xp_gain: int = 0
    lesson_id: Optional[str] = None
    mastery_percent: Optional[float] = None
    completed: Optional[bool] = None

@router.post("/register")
def register_user(req: RegisterRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if email already taken
    cursor.execute("SELECT id FROM users WHERE email = ?", (req.email.lower().strip(),))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    pwd_hash, salt = hash_password(req.password)
    role = req.role if req.role in ["student", "instructor"] else "student"
    initial_xp = 100 if role == "student" else 1000
    initial_lvl = 1 if role == "student" else 5

    cursor.execute("""
    INSERT INTO users (id, name, email, password_hash, salt, role, xp, level, streak_days, avatar_seed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    """, (user_id, req.name.strip(), req.email.lower().strip(), pwd_hash, salt, role, initial_xp, initial_lvl, req.name.lower()[:8]))

    # Award starter badge
    cursor.execute("INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, 'quantum_beginner')", (user_id,))

    conn.commit()
    conn.close()

    # Create token
    access_token = create_access_token({"sub": user_id, "role": role, "email": req.email.lower().strip()})

    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": req.name.strip(),
            "email": req.email.lower().strip(),
            "role": role,
            "xp": initial_xp,
            "level": initial_lvl,
            "streak_days": 1,
            "avatar_seed": req.name.lower()[:8]
        }
    }

@router.post("/login")
def login_user(req: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE email = ?", (req.email.lower().strip(),))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Verify password hash
    stored_hash = user["password_hash"]
    stored_salt = user["salt"]
    
    if not stored_hash or not stored_salt or not verify_password(req.password, stored_hash, stored_salt):
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    conn.close()

    access_token = create_access_token({
        "sub": user["id"],
        "role": user["role"],
        "email": user["email"]
    })

    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "xp": user["xp"],
            "level": user["level"],
            "streak_days": user["streak_days"],
            "avatar_seed": user["avatar_seed"]
        }
    }

@router.get("/me")
def get_current_profile(user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated.")
    return {
        "success": True,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "xp": user["xp"],
            "level": user["level"],
            "streak_days": user["streak_days"],
            "avatar_seed": user["avatar_seed"]
        }
    }

@router.post("/save-progress")
def sync_user_progress(
    req: UpdateProgressRequest,
    user: Dict[str, Any] = Depends(get_current_user_required)
):
    """Saves XP, level, and curriculum status to SQLite for the authenticated user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    user_id = user["id"]

    # 1. Update XP & Level
    if req.xp_gain > 0:
        new_xp = user["xp"] + req.xp_gain
        new_level = max(1, 1 + (new_xp // 200))
        cursor.execute("UPDATE users SET xp = ?, level = ? WHERE id = ?", (new_xp, new_level, user_id))

    # 2. Update lesson progress if specified
    if req.lesson_id:
        mastery = req.mastery_percent if req.mastery_percent is not None else 100.0
        comp = 1 if req.completed or req.completed is None else 0
        cursor.execute("""
        INSERT INTO user_progress (user_id, lesson_id, completed, mastery_percent, completed_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, lesson_id) DO UPDATE SET
            completed = excluded.completed,
            mastery_percent = excluded.mastery_percent,
            completed_at = CURRENT_TIMESTAMP
        """, (user_id, req.lesson_id, comp, mastery))

    conn.commit()

    # Re-fetch updated user stats
    cursor.execute("SELECT xp, level, streak_days FROM users WHERE id = ?", (user_id,))
    updated = cursor.fetchone()
    conn.close()

    return {
        "success": True,
        "user_id": user_id,
        "xp": updated["xp"],
        "level": updated["level"],
        "streak_days": updated["streak_days"]
    }
