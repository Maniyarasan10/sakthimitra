"""
Progress Tracking Router - Log, retrieve analytics, achievements
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.health import ProgressRecord
from app.utils.auth import get_current_active_user

router = APIRouter()


class LogWorkoutRequest(BaseModel):
    calories_burned: Optional[float] = None
    duration_minutes: Optional[int] = None
    exercises_completed: Optional[int] = None
    sets_completed: Optional[int] = None
    notes: Optional[str] = None
    mood: Optional[str] = None


class LogBodyMetricsRequest(BaseModel):
    weight_kg: Optional[float] = None
    body_fat_percent: Optional[float] = None
    muscle_mass_kg: Optional[float] = None
    waist_cm: Optional[float] = None
    notes: Optional[str] = None


class LogNutritionRequest(BaseModel):
    meals_tracked: Optional[int] = None
    total_calories_consumed: Optional[int] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None


def record_to_dict(r: ProgressRecord) -> dict:
    return {
        "id": r.id,
        "record_type": r.record_type,
        "record_date": r.record_date.isoformat() if r.record_date else None,
        "calories_burned": r.calories_burned,
        "workout_duration_minutes": r.workout_duration_minutes,
        "exercises_completed": r.exercises_completed,
        "sets_completed": r.sets_completed,
        "weight_kg": r.weight_kg,
        "bmi": r.bmi,
        "body_fat_percent": r.body_fat_percent,
        "muscle_mass_kg": r.muscle_mass_kg,
        "waist_cm": r.waist_cm,
        "meals_tracked": r.meals_tracked,
        "total_calories_consumed": r.total_calories_consumed,
        "protein_g": r.protein_g,
        "carbs_g": r.carbs_g,
        "fat_g": r.fat_g,
        "notes": r.notes,
        "mood": r.mood,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


@router.post("/log/workout")
async def log_workout(
    data: LogWorkoutRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Log a workout session"""
    record = ProgressRecord(
        user_id=current_user.id,
        record_type="workout",
        calories_burned=data.calories_burned,
        workout_duration_minutes=data.duration_minutes,
        exercises_completed=data.exercises_completed,
        sets_completed=data.sets_completed,
        notes=data.notes,
        mood=data.mood,
    )
    db.add(record)
    current_user.total_workouts += 1
    current_user.streak_points += 10
    db.commit()
    return {"message": "Workout logged successfully", "record": record_to_dict(record)}


@router.post("/log/body-metrics")
async def log_body_metrics(
    data: LogBodyMetricsRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Log body metrics"""
    bmi = None
    if data.weight_kg and current_user.height:
        h = current_user.height / 100
        bmi = round(data.weight_kg / (h ** 2), 1)

    if data.weight_kg:
        current_user.weight = data.weight_kg

    record = ProgressRecord(
        user_id=current_user.id,
        record_type="body_metrics",
        weight_kg=data.weight_kg,
        bmi=bmi,
        body_fat_percent=data.body_fat_percent,
        muscle_mass_kg=data.muscle_mass_kg,
        waist_cm=data.waist_cm,
        notes=data.notes,
    )
    db.add(record)
    db.commit()
    return {"message": "Body metrics logged", "record": record_to_dict(record), "bmi": bmi}


@router.post("/log/nutrition")
async def log_nutrition(
    data: LogNutritionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Log nutrition data"""
    record = ProgressRecord(
        user_id=current_user.id,
        record_type="nutrition",
        meals_tracked=data.meals_tracked,
        total_calories_consumed=data.total_calories_consumed,
        protein_g=data.protein_g,
        carbs_g=data.carbs_g,
        fat_g=data.fat_g,
    )
    db.add(record)
    db.commit()
    return {"message": "Nutrition logged", "record": record_to_dict(record)}


@router.get("/overview")
async def get_progress_overview(
    period: str = "month",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get progress overview with analytics"""
    days_map = {"week": 7, "month": 30, "3months": 90, "year": 365}
    days = days_map.get(period, 30)
    since = datetime.now() - timedelta(days=days)

    records = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == current_user.id,
        ProgressRecord.created_at >= since
    ).all()

    workout_records = [r for r in records if r.record_type == "workout"]
    body_records = [r for r in records if r.record_type == "body_metrics"]
    nutrition_records = [r for r in records if r.record_type == "nutrition"]

    total_calories = sum(r.calories_burned or 0 for r in workout_records)
    total_minutes = sum(r.workout_duration_minutes or 0 for r in workout_records)
    total_meals = sum(r.meals_tracked or 0 for r in nutrition_records)

    # Weight change
    weight_change = 0
    if len(body_records) >= 2:
        body_records.sort(key=lambda r: r.created_at)
        weight_change = round(
            (body_records[-1].weight_kg or 0) - (body_records[0].weight_kg or 0), 1
        )

    # BMI
    bmi = None
    if current_user.height and current_user.weight:
        h = current_user.height / 100
        bmi = round(current_user.weight / (h ** 2), 1)

    # Current streak
    streak = _calculate_streak(workout_records)

    return {
        "period": period,
        "total_workouts": current_user.total_workouts,
        "period_workouts": len(workout_records),
        "total_calories_burned": round(total_calories, 1),
        "total_workout_minutes": total_minutes,
        "total_meals_tracked": total_meals,
        "weight_change_kg": weight_change,
        "current_weight": current_user.weight,
        "bmi": bmi,
        "streak_points": current_user.streak_points,
        "current_streak_days": streak,
        "charity_donated": current_user.charity_donations,
    }


def _calculate_streak(records: list) -> int:
    if not records:
        return 0
    dates = sorted({r.created_at.date() for r in records if r.created_at}, reverse=True)
    if not dates:
        return 0
    streak = 1
    for i in range(1, len(dates)):
        if (dates[i - 1] - dates[i]).days == 1:
            streak += 1
        else:
            break
    return streak


@router.get("/workouts")
async def get_workout_analytics(
    period: str = "month",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get detailed workout analytics"""
    days_map = {"week": 7, "month": 30, "3months": 90, "year": 365}
    days = days_map.get(period, 30)
    since = datetime.now() - timedelta(days=days)

    records = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == current_user.id,
        ProgressRecord.record_type == "workout",
        ProgressRecord.created_at >= since
    ).order_by(ProgressRecord.created_at).all()

    chart_data = []
    for r in records:
        chart_data.append({
            "date": r.created_at.strftime("%Y-%m-%d") if r.created_at else "",
            "calories": r.calories_burned or 0,
            "duration": r.workout_duration_minutes or 0,
            "exercises": r.exercises_completed or 0,
        })

    return {
        "records": [record_to_dict(r) for r in records],
        "chart_data": chart_data,
        "total_calories": sum(r.calories_burned or 0 for r in records),
        "total_minutes": sum(r.workout_duration_minutes or 0 for r in records),
    }


@router.get("/body-metrics")
async def get_body_metrics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get body metrics history"""
    records = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == current_user.id,
        ProgressRecord.record_type == "body_metrics"
    ).order_by(ProgressRecord.created_at).all()

    chart_data = [
        {
            "date": r.created_at.strftime("%Y-%m-%d") if r.created_at else "",
            "weight": r.weight_kg,
            "bmi": r.bmi,
            "body_fat": r.body_fat_percent,
        }
        for r in records
    ]

    return {"records": [record_to_dict(r) for r in records], "chart_data": chart_data}


@router.get("/achievements")
async def get_achievements(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user achievements"""
    records = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == current_user.id
    ).all()

    workout_records = [r for r in records if r.record_type == "workout"]
    total_calories = sum(r.calories_burned or 0 for r in workout_records)
    total_meals = sum(r.meals_tracked or 0 for r in records if r.record_type == "nutrition")
    total_exercises = sum(r.exercises_completed or 0 for r in workout_records)
    streak = _calculate_streak(workout_records)
    total_workouts = current_user.total_workouts

    # Weight loss
    body_records = sorted(
        [r for r in records if r.record_type == "body_metrics" and r.weight_kg],
        key=lambda r: r.created_at
    )
    weight_lost = 0
    if len(body_records) >= 2:
        weight_lost = max(0, (body_records[0].weight_kg or 0) - (body_records[-1].weight_kg or 0))

    achievements = [
        {
            "id": "first_step",
            "icon": "🚶",
            "title": "First Step",
            "desc": "Complete your first workout",
            "progress": min(100, total_workouts * 100),
            "done": total_workouts >= 1,
            "pts": "+10 pts",
        },
        {
            "id": "workout_warrior",
            "icon": "💪",
            "title": "Workout Warrior",
            "desc": "Complete 5 workouts",
            "progress": min(100, int((total_workouts / 5) * 100)),
            "done": total_workouts >= 5,
        },
        {
            "id": "beast_mode",
            "icon": "🏋️",
            "title": "Beast Mode",
            "desc": "Complete 10 workouts",
            "progress": min(100, int((total_workouts / 10) * 100)),
            "done": total_workouts >= 10,
        },
        {
            "id": "nutrition_ninja",
            "icon": "🥗",
            "title": "Nutrition Ninja",
            "desc": "Track 5 meals",
            "progress": min(100, int((total_meals / 5) * 100)),
            "done": total_meals >= 5,
        },
        {
            "id": "exercise_excellence",
            "icon": "⚡",
            "title": "Exercise Excellence",
            "desc": "Complete 25 exercises",
            "progress": min(100, int((total_exercises / 25) * 100)),
            "done": total_exercises >= 25,
        },
        {
            "id": "fire_starter",
            "icon": "🔥",
            "title": "Fire Starter",
            "desc": "Burn 500 calories",
            "progress": min(100, int((total_calories / 500) * 100)),
            "done": total_calories >= 500,
        },
        {
            "id": "fire_master",
            "icon": "🔥🔥",
            "title": "Fire Master",
            "desc": "Burn 1000 calories",
            "progress": min(100, int((total_calories / 1000) * 100)),
            "done": total_calories >= 1000,
        },
        {
            "id": "consistency_counts",
            "icon": "📅",
            "title": "Consistency Counts",
            "desc": "Achieve 3-day streak",
            "progress": min(100, int((streak / 3) * 100)),
            "done": streak >= 3,
        },
        {
            "id": "streak_king",
            "icon": "👑",
            "title": "Streak King",
            "desc": "Achieve 7-day streak",
            "progress": min(100, int((streak / 7) * 100)),
            "done": streak >= 7,
        },
        {
            "id": "weight_loss_winner",
            "icon": "⚖️",
            "title": "Weight Loss Winner",
            "desc": "Lose 2kg",
            "progress": min(100, int((weight_lost / 2) * 100)),
            "done": weight_lost >= 2,
        },
        {
            "id": "major_transformation",
            "icon": "🎉",
            "title": "Major Transformation",
            "desc": "Lose 5kg",
            "progress": min(100, int((weight_lost / 5) * 100)),
            "done": weight_lost >= 5,
        },
    ]

    unlocked = sum(1 for a in achievements if a["done"])
    return {
        "achievements": achievements,
        "unlocked": unlocked,
        "total": len(achievements),
        "overall_progress": int((unlocked / len(achievements)) * 100),
    }