"""
FastAPI Routes for Learn Section, Curriculum Modules & Guided Roadmap Planner
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.core.db import get_db_connection
from app.core.auth import get_current_user_optional
import json

router = APIRouter(prefix="/api/learn", tags=["learn"])

class ProgressUpdateRequest(BaseModel):
    user_id: Optional[str] = "user_default"
    lesson_id: str
    completed: bool = True
    mastery_percent: float = 100.0

class RoadmapToggleRequest(BaseModel):
    user_id: Optional[str] = "user_default"
    item_id: Optional[str] = None
    topic_id: Optional[str] = None
    is_completed: Optional[bool] = None
    completed: Optional[bool] = None

    @property
    def target_item_id(self) -> str:
        return self.item_id or self.topic_id or ""

    @property
    def target_is_completed(self) -> bool:
        if self.is_completed is not None:
            return self.is_completed
        if self.completed is not None:
            return self.completed
        return True

@router.get("/lessons")
def get_all_lessons(
    user_id: Optional[str] = None,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    active_user_id = user_id or (current_user["id"] if current_user else "user_default")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    SELECT l.*, 
           COALESCE(p.completed, 0) as is_completed,
           COALESCE(p.mastery_percent, 0.0) as user_mastery
    FROM lessons l
    LEFT JOIN user_progress p ON l.id = p.lesson_id AND p.user_id = ?
    ORDER BY l.order_num ASC
    """, (active_user_id,))
    
    rows = cursor.fetchall()
    lessons = []
    for r in rows:
        lessons.append({
            "id": r["id"],
            "order": r["order_num"],
            "title": r["title"],
            "category": r["category"],
            "summary": r["summary"],
            "interactive_component": r["interactive_component"],
            "starter_circuit": json.loads(r["starter_circuit_json"]) if r["starter_circuit_json"] else [],
            "xp_reward": r["xp_reward"],
            "is_completed": bool(r["is_completed"]),
            "mastery_percent": round(float(r["user_mastery"]), 1)
        })
    conn.close()
    return {"success": True, "lessons": lessons}

@router.get("/lessons/{lesson_id}")
def get_lesson_detail(
    lesson_id: str,
    user_id: Optional[str] = None,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    active_user_id = user_id or (current_user["id"] if current_user else "user_default")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    SELECT l.*, 
           COALESCE(p.completed, 0) as is_completed,
           COALESCE(p.mastery_percent, 0.0) as user_mastery
    FROM lessons l
    LEFT JOIN user_progress p ON l.id = p.lesson_id AND p.user_id = ?
    WHERE l.id = ?
    """, (active_user_id, lesson_id))
    
    r = cursor.fetchone()
    if not r:
        conn.close()
        raise HTTPException(status_code=404, detail="Lesson not found.")

    # Also fetch attached quiz question
    cursor.execute("SELECT * FROM quiz_questions WHERE lesson_id = ? LIMIT 1", (lesson_id,))
    q_row = cursor.fetchone()
    quiz_data = None
    if q_row:
        quiz_data = {
            "id": q_row["id"],
            "question": q_row["question_text"],
            "options": json.loads(q_row["options_json"]),
            "correct_index": q_row["correct_index"],
            "explanation": q_row["explanation"],
            "difficulty": q_row["difficulty"]
        }

    lesson = {
        "id": r["id"],
        "order": r["order_num"],
        "title": r["title"],
        "category": r["category"],
        "summary": r["summary"],
        "content_markdown": r["content_markdown"],
        "interactive_component": r["interactive_component"],
        "starter_circuit": json.loads(r["starter_circuit_json"]) if r["starter_circuit_json"] else [],
        "xp_reward": r["xp_reward"],
        "is_completed": bool(r["is_completed"]),
        "mastery_percent": round(float(r["user_mastery"]), 1),
        "quiz": quiz_data
    }
    conn.close()
    return {"success": True, "lesson": lesson}

@router.post("/progress")
def update_progress(
    req: ProgressUpdateRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    active_user_id = (current_user["id"] if current_user else None) or req.user_id or "user_default"
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    INSERT INTO user_progress (user_id, lesson_id, completed, mastery_percent, completed_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, lesson_id) DO UPDATE SET
        completed = excluded.completed,
        mastery_percent = excluded.mastery_percent,
        completed_at = CURRENT_TIMESTAMP
    """, (active_user_id, req.lesson_id, 1 if req.completed else 0, req.mastery_percent))

    # Add XP to user
    cursor.execute("UPDATE users SET xp = xp + 50 WHERE id = ?", (active_user_id,))
    # Auto recalculate level
    cursor.execute("UPDATE users SET level = MAX(1, 1 + (xp / 200)) WHERE id = ?", (active_user_id,))

    conn.commit()
    conn.close()
    return {"success": True, "message": "Progress recorded successfully."}

@router.get("/roadmap")
def get_guided_roadmap(
    user_id: Optional[str] = None,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Returns guided learning roadmap plan with topics, descriptions,
    estimated study time, and user checklist completion status.
    """
    active_user_id = user_id or (current_user["id"] if current_user else "user_default")
    conn = get_db_connection()
    cursor = conn.cursor()

    # Pre-defined roadmap modules
    roadmap_structure = [
        {"id": "rm_basics", "stage": "Stage 1: Foundations", "title": "Quantum Computing Basics & Mathematics", "lesson_id": "basics", "est_minutes": 25, "recommended_order": 1},
        {"id": "rm_qubits", "stage": "Stage 1: Foundations", "title": "Qubits & Hilbert Space Statevectors", "lesson_id": "qubits", "est_minutes": 30, "recommended_order": 2},
        {"id": "rm_superposition", "stage": "Stage 1: Foundations", "title": "Superposition Principle & Hadamard Gate", "lesson_id": "superposition", "est_minutes": 35, "recommended_order": 3},
        {"id": "rm_measurement", "stage": "Stage 2: Core Operations", "title": "Quantum Measurement & Wavefunction Collapse", "lesson_id": "measurement", "est_minutes": 30, "recommended_order": 4},
        {"id": "rm_gates", "stage": "Stage 2: Core Operations", "title": "Single-Qubit Unitary Gates (X, Y, Z, S, T)", "lesson_id": "gates", "est_minutes": 40, "recommended_order": 5},
        {"id": "rm_circuit", "stage": "Stage 2: Core Operations", "title": "Quantum Circuit Design & Wire Layouts", "lesson_id": "circuit_design", "est_minutes": 35, "recommended_order": 6},
        {"id": "rm_entangle", "stage": "Stage 3: Multi-Qubit Systems", "title": "Quantum Entanglement & Non-Separability", "lesson_id": "entanglement", "est_minutes": 45, "recommended_order": 7},
        {"id": "rm_bell", "stage": "Stage 3: Multi-Qubit Systems", "title": "The Four Canonical Bell States & CHSH Test", "lesson_id": "bell_states", "est_minutes": 50, "recommended_order": 8},
        {"id": "rm_algo_dj", "stage": "Stage 4: Quantum Algorithms", "title": "Phase Kickback & Deutsch-Jozsa Algorithm", "lesson_id": "algorithms", "est_minutes": 45, "recommended_order": 9},
        {"id": "rm_grover", "stage": "Stage 4: Quantum Algorithms", "title": "Grover's Search & Amplitude Amplification", "lesson_id": "algorithms", "est_minutes": 60, "recommended_order": 10},
        {"id": "rm_teleport", "stage": "Stage 5: Protocols & Hardware", "title": "Quantum Teleportation 3-Qubit Protocol", "lesson_id": "cryptography", "est_minutes": 50, "recommended_order": 11},
        {"id": "rm_bb84", "stage": "Stage 5: Protocols & Hardware", "title": "BB84 Quantum Key Distribution & No-Cloning", "lesson_id": "cryptography", "est_minutes": 45, "recommended_order": 12},
        {"id": "rm_nisq", "stage": "Stage 5: Protocols & Hardware", "title": "NISQ Computing, Noise Models & Fidelity", "lesson_id": "nisq", "est_minutes": 40, "recommended_order": 13},
        {"id": "rm_programming", "stage": "Stage 6: Capstone & Mastery", "title": "Python Qiskit SDK Development", "lesson_id": "programming", "est_minutes": 55, "recommended_order": 14},
        {"id": "rm_capstone", "stage": "Stage 6: Capstone & Mastery", "title": "Capstone Protocol: Build, Simulate & Benchmark", "lesson_id": "final_project", "est_minutes": 90, "recommended_order": 15},
    ]

    cursor.execute("SELECT item_id, is_completed FROM user_roadmap WHERE user_id = ?", (active_user_id,))
    checked_map = {row["item_id"]: bool(row["is_completed"]) for row in cursor.fetchall()}

    # Also check lesson_progress
    cursor.execute("SELECT lesson_id, completed FROM user_progress WHERE user_id = ? AND completed = 1", (active_user_id,))
    completed_lessons = {row["lesson_id"] for row in cursor.fetchall()}

    items = []
    completed_count = 0
    for item in roadmap_structure:
        # Marked as checked either by explicit user roadmap checkbox or lesson completion
        is_done = checked_map.get(item["id"], item["lesson_id"] in completed_lessons)
        if is_done:
            completed_count += 1
        items.append({
            **item,
            "category": item.get("stage", "Standard"),
            "level": item.get("stage", "").split(":")[0] if ":" in item.get("stage", "") else "Foundations",
            "description": f"Milestone #{item['recommended_order']} • Focus: {item['title']} (Est. {item['est_minutes']} mins)",
            "order_idx": item["recommended_order"],
            "is_completed": is_done
        })

    conn.close()

    total = len(roadmap_structure)
    progress_pct = round((completed_count / total * 100), 1) if total > 0 else 0.0

    return {
        "success": True,
        "user_id": active_user_id,
        "completed_count": completed_count,
        "total_count": total,
        "progress_percentage": progress_pct,
        "roadmap": items,
        "topics": items
    }

@router.post("/roadmap/toggle")
def toggle_roadmap_item(
    req: RoadmapToggleRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    active_user_id = req.user_id or (current_user["id"] if current_user else "user_default")
    item_id = req.target_item_id
    is_completed = req.target_is_completed
    conn = get_db_connection()
    cursor = conn.cursor()

    val = 1 if is_completed else 0
    cursor.execute("""
    INSERT INTO user_roadmap (user_id, item_id, is_completed, completed_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, item_id) DO UPDATE SET
        is_completed = excluded.is_completed,
        completed_at = CURRENT_TIMESTAMP
    """, (active_user_id, item_id, val))

    # If marked completed, award XP
    if is_completed:
        cursor.execute("UPDATE users SET xp = xp + 25 WHERE id = ?", (active_user_id,))
        cursor.execute("UPDATE users SET level = MAX(1, 1 + (xp / 200)) WHERE id = ?", (active_user_id,))

    conn.commit()
    conn.close()

    return {"success": True, "item_id": item_id, "is_completed": is_completed}
