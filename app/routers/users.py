"""
Users Router - Profile management, update, photo upload
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import os
import shutil
import uuid

from app.database import get_db
from app.models.user import User, FitnessGoal, WorkoutPreference, DietPreference
from app.utils.auth import get_current_active_user

router = APIRouter()

UPLOAD_DIR = "static/profile_photos"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    fitness_level: Optional[str] = None
    fitness_goal: Optional[FitnessGoal] = None
    workout_preference: Optional[WorkoutPreference] = None
    diet_preference: Optional[DietPreference] = None


def user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "is_active": user.is_active,
        "phone": user.phone,
        "bio": user.bio,
        "age": user.age,
        "gender": user.gender,
        "height": user.height,
        "weight": user.weight,
        "fitness_level": user.fitness_level,
        "fitness_goal": user.fitness_goal.value if user.fitness_goal else None,
        "workout_preference": user.workout_preference.value if user.workout_preference else None,
        "diet_preference": user.diet_preference.value if user.diet_preference else None,
        "streak_points": user.streak_points,
        "total_workouts": user.total_workouts,
        "charity_donations": user.charity_donations,
        "google_calendar_connected": user.google_calendar_connected,
        "profile_photo_url": user.profile_photo_url,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.get("/profile")
async def get_profile(current_user: User = Depends(get_current_active_user)):
    """Get current user's full profile"""
    # Calculate BMI if height and weight exist
    bmi = None
    if current_user.height and current_user.weight:
        height_m = current_user.height / 100
        bmi = round(current_user.weight / (height_m ** 2), 1)

    profile = user_to_dict(current_user)
    profile["bmi"] = bmi
    return profile


@router.put("/profile")
async def update_profile(
    update_data: UserUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    # Check email uniqueness if changing
    if update_data.email and update_data.email != current_user.email:
        existing = db.query(User).filter(User.email == update_data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")

    update_fields = update_data.dict(exclude_none=True)
    for field, value in update_fields.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return {"message": "Profile updated successfully", "user": user_to_dict(current_user)}


@router.post("/profile/photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload profile photo"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, GIF, WEBP allowed.")

    # Save file
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    file_name = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Update user
    photo_url = f"/static/profile_photos/{file_name}"
    current_user.profile_photo_url = photo_url
    db.commit()

    return {"message": "Profile photo uploaded successfully", "photo_url": photo_url}


@router.get("/stats")
async def get_user_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user statistics and charity impact"""
    from app.models.health import ProgressRecord

    # Total calories burned
    records = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == current_user.id,
        ProgressRecord.record_type == "workout"
    ).all()

    total_calories = sum(r.calories_burned or 0 for r in records)
    total_workout_minutes = sum(r.workout_duration_minutes or 0 for r in records)

    # Meal records
    meal_records = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == current_user.id,
        ProgressRecord.record_type == "nutrition"
    ).all()
    total_meals = sum(r.meals_tracked or 0 for r in meal_records)

    # Charity calculation: ₹5 per workout, ₹1 per 10 calories, ₹2 per meal
    charity_from_workouts = current_user.total_workouts * 5
    charity_from_calories = (total_calories // 10) * 1
    charity_from_meals = total_meals * 2
    total_charity = charity_from_workouts + charity_from_calories + charity_from_meals

    # Charity level
    if total_charity >= 5000:
        level = "Platinum"
    elif total_charity >= 1000:
        level = "Gold"
    elif total_charity >= 500:
        level = "Silver"
    else:
        level = "Bronze"

    return {
        "total_workouts": current_user.total_workouts,
        "total_calories_burned": round(total_calories, 1),
        "total_workout_minutes": total_workout_minutes,
        "total_meals_tracked": total_meals,
        "streak_points": current_user.streak_points,
        "charity_impact": {
            "total_donation": round(total_charity, 2),
            "from_workouts": charity_from_workouts,
            "from_calories": charity_from_calories,
            "from_meals": charity_from_meals,
            "level": level,
            "people_impacted": max(0, total_charity // 50),
        }
    }


@router.delete("/account")
async def delete_account(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Soft delete user account"""
    current_user.is_active = False
    db.commit()
    return {"message": "Account deactivated successfully"}