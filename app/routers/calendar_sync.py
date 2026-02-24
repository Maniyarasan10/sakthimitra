"""
Google Calendar Sync Router
Sync workout and nutrition plans to Google Calendar
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta, date
import json

from app.database import get_db
from app.models.user import User
from app.models.workout import WorkoutPlan, Exercise
from app.models.nutrition import NutritionPlan, Meal
from app.utils.auth import get_current_active_user
from app.utils.config import settings
from app.services.calendar_service import calendar_service

router = APIRouter()


# ─── Schemas ──────────────────────────────────────────────────────────────────

class CalendarSyncRequest(BaseModel):
    sync_workouts: bool = True
    sync_meals: bool = True
    start_date: Optional[str] = None  # ISO date string


class CalendarConnectRequest(BaseModel):
    code: str  # OAuth authorization code


# ─── OAuth ────────────────────────────────────────────────────────────────────

@router.get("/auth-url")
async def get_google_auth_url(
    current_user: User = Depends(get_current_active_user),
):
    """Get Google OAuth URL for Calendar authorization"""
    try:
        url = calendar_service.get_authorization_url()
        return {"auth_url": url}
    except Exception as e:
        return {
            "auth_url": (
                f"https://accounts.google.com/o/oauth2/v2/auth"
                f"?client_id={settings.GOOGLE_CALENDAR_CLIENT_ID}"
                f"&redirect_uri={settings.GOOGLE_CALENDAR_REDIRECT_URI}"
                f"&response_type=code"
                f"&scope=https://www.googleapis.com/auth/calendar"
                f"&access_type=offline"
            ),
            "note": "Configure GOOGLE_CALENDAR_CLIENT_ID in .env",
        }


@router.post("/connect")
async def connect_google_calendar(
    data: CalendarConnectRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Exchange OAuth code for tokens and save to user"""
    try:
        token_data = calendar_service.exchange_code_for_token(data.code)
        current_user.google_calendar_token = json.dumps(token_data)
        current_user.google_calendar_connected = True
        db.commit()
        return {"success": True, "message": "Google Calendar connected successfully!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to connect Google Calendar: {str(e)}")


@router.get("/status")
async def get_calendar_status(
    current_user: User = Depends(get_current_active_user),
):
    """Check if Google Calendar is connected"""
    return {
        "connected": current_user.google_calendar_connected,
        "email": current_user.email if current_user.google_calendar_connected else None,
    }


@router.delete("/disconnect")
async def disconnect_google_calendar(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Disconnect Google Calendar"""
    current_user.google_calendar_token = None
    current_user.google_calendar_connected = False
    db.commit()
    return {"success": True, "message": "Google Calendar disconnected"}


# ─── Sync ─────────────────────────────────────────────────────────────────────

@router.post("/sync")
async def sync_plans_to_calendar(
    request: CalendarSyncRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Sync active workout and nutrition plans to Google Calendar"""
    if not current_user.google_calendar_connected:
        raise HTTPException(
            status_code=400,
            detail="Google Calendar not connected. Please connect first.",
        )

    token_data = None
    if current_user.google_calendar_token:
        try:
            token_data = json.loads(current_user.google_calendar_token)
        except Exception:
            pass

    events_created = []
    errors = []

    start = datetime.now().date()
    if request.start_date:
        try:
            start = date.fromisoformat(request.start_date)
        except ValueError:
            pass

    # Sync workout plan
    if request.sync_workouts:
        workout_plan = (
            db.query(WorkoutPlan)
            .filter(WorkoutPlan.user_id == current_user.id, WorkoutPlan.is_active == True)
            .first()
        )
        if workout_plan:
            exercises = db.query(Exercise).filter(Exercise.workout_plan_id == workout_plan.id).all()
            days_map: dict = {}
            for ex in exercises:
                days_map.setdefault(ex.day_of_week, []).append(ex)

            DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            today_idx = start.weekday()

            for day_name, day_exercises in days_map.items():
                try:
                    day_idx = DAYS.index(day_name)
                    delta = (day_idx - today_idx) % 7
                    event_date = start + timedelta(days=delta)

                    exercise_names = [e.exercise_name for e in day_exercises[:3]]
                    desc_lines = [
                        f"• {e.exercise_name}: {e.sets} sets × {e.reps} reps" for e in day_exercises
                    ]
                    desc_lines.append("\n🌟 Generated by ArogyaMitra - Your AI Fitness Companion!")

                    event = {
                        "summary": f"💪 {workout_plan.plan_name} - {day_name}",
                        "description": "\n".join(desc_lines),
                        "date": event_date.isoformat(),
                        "start_time": "07:00",
                        "duration_minutes": workout_plan.duration_minutes or 45,
                        "reminders": [10, 30],
                    }

                    if token_data:
                        result = calendar_service.create_event(token_data, event)
                        events_created.append({"day": day_name, "event_id": result.get("id")})
                    else:
                        events_created.append({"day": day_name, "status": "simulated"})
                except Exception as e:
                    errors.append({"day": day_name, "error": str(e)})

    # Sync nutrition plan
    if request.sync_meals:
        nutrition_plan = (
            db.query(NutritionPlan)
            .filter(NutritionPlan.user_id == current_user.id, NutritionPlan.is_active == True)
            .first()
        )
        if nutrition_plan:
            meals = db.query(Meal).filter(Meal.nutrition_plan_id == nutrition_plan.id).all()
            meal_times = {"Breakfast": "07:00", "Lunch": "12:30", "Dinner": "19:30", "Snack": "16:00"}
            DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            today_idx = start.weekday()

            added_days = set()
            for meal in meals:
                key = (meal.day_of_week, meal.meal_type)
                if key in added_days:
                    continue
                added_days.add(key)

                try:
                    day_idx = DAYS.index(meal.day_of_week) if meal.day_of_week in DAYS else 0
                    delta = (day_idx - today_idx) % 7
                    event_date = start + timedelta(days=delta)
                    meal_time = meal_times.get(meal.meal_type, "12:00")
                    description = (
                        f"🍽️ {meal.meal_name}\n"
                        f"Calories: {meal.calories} kcal\n"
                        f"Protein: {meal.protein_g}g | Carbs: {meal.carbs_g}g | Fat: {meal.fat_g}g\n\n"
                        "🌿 Generated by ArogyaMitra"
                    )

                    event = {
                        "summary": f"🍽️ {meal.meal_type} - {meal.meal_name[:30]}",
                        "description": description,
                        "date": event_date.isoformat(),
                        "start_time": meal_time,
                        "duration_minutes": 30,
                    }

                    if token_data:
                        result = calendar_service.create_event(token_data, event)
                        events_created.append({"meal": meal.meal_name, "event_id": result.get("id")})
                    else:
                        events_created.append({"meal": meal.meal_name, "status": "simulated"})
                except Exception as e:
                    errors.append({"meal": meal.meal_name, "error": str(e)})

    return {
        "success": True,
        "events_created": len(events_created),
        "events": events_created,
        "errors": errors,
        "message": f"Successfully synced {len(events_created)} events to Google Calendar!",
    }


@router.post("/sync-workout")
async def sync_workout_only(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Sync only the active workout plan"""
    return await sync_plans_to_calendar(
        CalendarSyncRequest(sync_workouts=True, sync_meals=False),
        current_user,
        db,
    )


@router.post("/sync-meals")
async def sync_meals_only(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Sync only the active nutrition plan"""
    return await sync_plans_to_calendar(
        CalendarSyncRequest(sync_workouts=False, sync_meals=True),
        current_user,
        db,
    )