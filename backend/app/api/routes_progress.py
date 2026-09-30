"""
FastAPI Routes for Progress Analytics, Mastery, Badges & Leaderboard
"""

from fastapi import APIRouter
from app.core.db import get_db_connection
from typing import Dict, Any, List

router = APIRouter(prefix="/api/progress", tags=["progress"])

@router.get("/dashboard")
def get_user_dashboard(user_id: str = "user_default"):
    conn = get_db_connection()
    cursor = conn.cursor()

    # User info
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        return {"error": "User not found"}

    # Completed lessons count
    cursor.execute("SELECT COUNT(*) FROM user_progress WHERE user_id = ? AND completed = 1", (user_id,))
    completed_lessons = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM lessons")
    total_lessons = cursor.fetchone()[0]

    # Topic mastery average
    cursor.execute("SELECT AVG(mastery_percent) FROM user_progress WHERE user_id = ?", (user_id,))
    avg_mastery = cursor.fetchone()[0] or 0.0

    # User badges
    cursor.execute("""
    SELECT b.*, ub.awarded_at
    FROM badges b
    JOIN user_badges ub ON b.id = ub.badge_id
    WHERE ub.user_id = ?
    """, (user_id,))
    badges = [dict(r) for r in cursor.fetchall()]

    # Simulation runs count
    cursor.execute("SELECT COUNT(*) FROM simulation_runs WHERE user_id = ?", (user_id,))
    sim_runs_count = cursor.fetchone()[0]

    # Challenges completed
    cursor.execute("SELECT COUNT(*) FROM challenge_attempts WHERE user_id = ? AND passed = 1", (user_id,))
    challenges_passed = cursor.fetchone()[0]

    # Weak topics (mastery < 70% or uncompleted)
    cursor.execute("""
    SELECT l.id, l.title, COALESCE(p.mastery_percent, 0.0) as mastery
    FROM lessons l
    LEFT JOIN user_progress p ON l.id = p.lesson_id AND p.user_id = ?
    WHERE COALESCE(p.mastery_percent, 0.0) < 70.0
    LIMIT 3
    """, (user_id,))
    weak_topics = [{"id": r["id"], "title": r["title"], "mastery": round(float(r["mastery"]), 1)} for r in cursor.fetchall()]

    # Recent simulation activity
    cursor.execute("""
    SELECT id, num_qubits, gate_count, run_at
    FROM simulation_runs
    WHERE user_id = ?
    ORDER BY run_at DESC
    LIMIT 5
    """, (user_id,))
    recent_activity = [dict(r) for r in cursor.fetchall()]

    conn.close()

    # Recommended next action
    recommended = "Complete Lesson 5: Single-Qubit Quantum Gates"
    if weak_topics:
        recommended = f"Practice and reinforce: {weak_topics[0]['title']}"

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
        },
        "stats": {
            "completed_lessons": completed_lessons,
            "total_lessons": total_lessons,
            "overall_progress_percent": round((completed_lessons / total_lessons) * 100, 1) if total_lessons > 0 else 0,
            "average_mastery": round(float(avg_mastery), 1),
            "simulations_executed": sim_runs_count,
            "challenges_completed": challenges_passed
        },
        "badges": badges,
        "weak_topics": weak_topics,
        "recent_activity": recent_activity,
        "recommended_next_action": recommended
    }

@router.get("/leaderboard")
def get_leaderboard(category: str = "national"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT u.id, u.name, u.role, u.xp, u.level, u.streak_days, u.avatar_seed,
           COUNT(DISTINCT ca.id) as challenges_done
    FROM users u
    LEFT JOIN challenge_attempts ca ON u.id = ca.user_id AND ca.passed = 1
    WHERE u.role = 'student'
    GROUP BY u.id
    ORDER BY u.xp DESC
    LIMIT 10
    """)
    rows = cursor.fetchall()
    
    leaderboard = []
    for rank, r in enumerate(rows, 1):
        leaderboard.append({
            "rank": rank,
            "id": r["id"],
            "name": r["name"],
            "xp": r["xp"],
            "level": r["level"],
            "streak_days": r["streak_days"],
            "challenges_done": r["challenges_done"],
            "avatar_seed": r["avatar_seed"]
        })
    conn.close()
    return {"success": True, "category": category, "leaderboard": leaderboard}

@router.get("/badges")
def get_all_badges(user_id: str = "user_default"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT b.*, 
           CASE WHEN ub.user_id IS NOT NULL THEN 1 ELSE 0 END as is_unlocked,
           ub.awarded_at
    FROM badges b
    LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
    ORDER BY b.category ASC
    """, (user_id,))
    rows = cursor.fetchall()
    badges = [dict(r) for r in rows]
    conn.close()
    return {"success": True, "badges": badges}
