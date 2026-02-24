"""
Admin Router
Admin dashboard, user management, and platform analytics
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User, UserRole
from app.models.workout import WorkoutPlan
from app.models.nutrition import NutritionPlan
from app.models.health import HealthAssessment, ProgressRecord, ChatSession
from app.utils.auth import get_current_active_user, get_password_hash

router = APIRouter()


# ─── Dependency ───────────────────────────────────────────────────────────────

def require_admin(current_user: User = Depends(get_current_active_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


# ─── Schemas ──────────────────────────────────────────────────────────────────

class UserUpdateAdmin(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None
    fitness_level: Optional[str] = None


# ─── Dashboard ────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def admin_dashboard(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin dashboard with platform-wide statistics"""
    total_users = db.query(func.count(User.id)).scalar()
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    total_workouts = db.query(func.count(WorkoutPlan.id)).scalar()
    total_nutrition_plans = db.query(func.count(NutritionPlan.id)).scalar()
    total_assessments = db.query(func.count(HealthAssessment.id)).scalar()
    total_progress_records = db.query(func.count(ProgressRecord.id)).scalar()

    # New users in last 7 days
    week_ago = datetime.now() - timedelta(days=7)
    new_users_week = (
        db.query(func.count(User.id))
        .filter(User.created_at >= week_ago)
        .scalar()
    )

    # Total charity donations
    total_charity = db.query(func.sum(User.charity_donations)).scalar() or 0.0

    # Recent users
    recent_users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "stats": {
            "total_users": total_users,
            "active_users": active_users,
            "new_users_this_week": new_users_week,
            "total_workout_plans": total_workouts,
            "total_nutrition_plans": total_nutrition_plans,
            "total_health_assessments": total_assessments,
            "total_progress_records": total_progress_records,
            "total_charity_donated_inr": round(total_charity, 2),
        },
        "recent_users": [_user_summary(u) for u in recent_users],
    }


# ─── User Management ──────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, le=100),
    search: Optional[str] = Query(default=None),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all users with pagination"""
    query = db.query(User)
    if search:
        query = query.filter(
            (User.full_name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%")) |
            (User.username.ilike(f"%{search}%"))
        )

    total = query.count()
    users = (
        query.order_by(User.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return {
        "users": [_user_detail(u, db) for u in users],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }


@router.get("/users/{user_id}")
async def get_user_detail(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get detailed info for a specific user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user": _user_detail(user, db)}


@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    data: UserUpdateAdmin,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update a user's admin-level fields"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.is_active is not None:
        user.is_active = data.is_active
    if data.role is not None:
        try:
            user.role = UserRole(data.role)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role")
    if data.fitness_level is not None:
        user.fitness_level = data.fitness_level

    db.commit()
    return {"success": True, "message": "User updated", "user": _user_summary(user)}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Permanently delete a user (hard delete)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    db.delete(user)
    db.commit()
    return {"success": True, "message": f"User {user.username} deleted permanently"}


# ─── Platform Analytics ───────────────────────────────────────────────────────

@router.get("/analytics/workouts")
async def workout_analytics(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Platform-wide workout analytics"""
    total_plans = db.query(func.count(WorkoutPlan.id)).scalar()
    active_plans = db.query(func.count(WorkoutPlan.id)).filter(WorkoutPlan.is_active == True).scalar()

    # Top fitness goals
    goal_distribution = (
        db.query(User.fitness_goal, func.count(User.id))
        .group_by(User.fitness_goal)
        .all()
    )

    # Top workout preferences
    pref_distribution = (
        db.query(User.workout_preference, func.count(User.id))
        .group_by(User.workout_preference)
        .all()
    )

    return {
        "total_workout_plans": total_plans,
        "active_workout_plans": active_plans,
        "fitness_goal_distribution": {str(g): c for g, c in goal_distribution},
        "workout_preference_distribution": {str(p): c for p, c in pref_distribution},
    }


@router.get("/analytics/charity")
async def charity_analytics(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Charity donation statistics"""
    total = db.query(func.sum(User.charity_donations)).scalar() or 0.0
    max_donor = (
        db.query(User)
        .order_by(User.charity_donations.desc())
        .first()
    )

    # Level distribution
    users = db.query(User).all()
    levels = {"Bronze": 0, "Silver": 0, "Gold": 0, "Platinum": 0}
    for u in users:
        d = u.charity_donations or 0
        if d >= 5000:
            levels["Platinum"] += 1
        elif d >= 1000:
            levels["Gold"] += 1
        elif d >= 500:
            levels["Silver"] += 1
        else:
            levels["Bronze"] += 1

    return {
        "total_donated_inr": round(total, 2),
        "top_donor": _user_summary(max_donor) if max_donor else None,
        "level_distribution": levels,
        "estimated_people_impacted": int(total / 50),
    }


@router.post("/broadcast-message")
async def broadcast_message(
    message: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Placeholder: broadcast a system message to all users"""
    user_count = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    return {
        "success": True,
        "message": f"Message queued for {user_count} active users",
        "broadcast": message,
    }


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _user_summary(u: User) -> dict:
    return {
        "id": u.id,
        "username": u.username,
        "full_name": u.full_name,
        "email": u.email,
        "role": u.role.value if u.role else "user",
        "is_active": u.is_active,
        "total_workouts": u.total_workouts,
        "charity_donations": u.charity_donations,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


def _user_detail(u: User, db: Session) -> dict:
    workout_count = db.query(func.count(WorkoutPlan.id)).filter(WorkoutPlan.user_id == u.id).scalar()
    nutrition_count = db.query(func.count(NutritionPlan.id)).filter(NutritionPlan.user_id == u.id).scalar()
    progress_count = db.query(func.count(ProgressRecord.id)).filter(ProgressRecord.user_id == u.id).scalar()

    return {
        **_user_summary(u),
        "age": u.age,
        "gender": u.gender,
        "height": u.height,
        "weight": u.weight,
        "fitness_level": u.fitness_level,
        "fitness_goal": u.fitness_goal.value if u.fitness_goal else None,
        "workout_preference": u.workout_preference.value if u.workout_preference else None,
        "diet_preference": u.diet_preference.value if u.diet_preference else None,
        "streak_points": u.streak_points,
        "google_calendar_connected": u.google_calendar_connected,
        "workout_plans": workout_count,
        "nutrition_plans": nutrition_count,
        "progress_records": progress_count,
    }