"""
Health Assessment Router
Handles health assessment submission and AI analysis generation
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.health import HealthAssessment
from app.utils.auth import get_current_active_user
from app.services.ai_agent import ai_agent

router = APIRouter()


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class AssessmentSubmit(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    fitness_level: Optional[str] = "beginner"
    fitness_goal: Optional[str] = "general_fitness"
    workout_place: Optional[str] = "home"
    workout_time: Optional[str] = "morning"
    available_minutes_per_day: Optional[int] = 30
    medical_history: Optional[str] = None
    current_health_conditions: Optional[str] = None
    injuries: Optional[str] = None
    allergies: Optional[str] = None
    medications: Optional[str] = None
    diet_preference: Optional[str] = "vegetarian"
    sync_to_calendar: Optional[bool] = False


class HealthAnalysisRequest(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    bmi: Optional[float] = None
    medical_history: Optional[str] = None
    injuries: Optional[str] = None
    allergies: Optional[str] = None
    medications: Optional[str] = None
    health_conditions: Optional[str] = None
    fitness_level: Optional[str] = "beginner"
    fitness_goal: Optional[str] = "general fitness"


# ─── Helper ───────────────────────────────────────────────────────────────────

def assessment_to_dict(a: HealthAssessment) -> dict:
    return {
        "id": a.id,
        "user_id": a.user_id,
        "age": a.age,
        "gender": a.gender,
        "height_cm": a.height_cm,
        "weight_kg": a.weight_kg,
        "bmi": a.bmi,
        "fitness_level": a.fitness_level,
        "fitness_goal": a.fitness_goal,
        "workout_place": a.workout_place,
        "workout_time": a.workout_time,
        "available_minutes_per_day": a.available_minutes_per_day,
        "medical_history": a.medical_history,
        "current_health_conditions": a.current_health_conditions,
        "injuries": a.injuries,
        "allergies": a.allergies,
        "medications": a.medications,
        "diet_preference": a.diet_preference,
        "sync_to_calendar": a.sync_to_calendar,
        "ai_analysis": a.ai_analysis,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/submit")
async def submit_assessment(
    data: AssessmentSubmit,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Submit health assessment and trigger AI plan generation"""

    # Calculate BMI
    bmi = None
    if data.height_cm and data.weight_kg and data.height_cm > 0:
        height_m = data.height_cm / 100
        bmi = round(data.weight_kg / (height_m ** 2), 1)

    # Update user profile with assessment data
    if data.age:
        current_user.age = data.age
    if data.gender:
        current_user.gender = data.gender
    if data.height_cm:
        current_user.height = data.height_cm
    if data.weight_kg:
        current_user.weight = data.weight_kg
    if data.fitness_level:
        current_user.fitness_level = data.fitness_level

    db.commit()

    # Create assessment record
    assessment = HealthAssessment(
        user_id=current_user.id,
        age=data.age,
        gender=data.gender,
        height_cm=data.height_cm,
        weight_kg=data.weight_kg,
        bmi=bmi,
        fitness_level=data.fitness_level,
        fitness_goal=data.fitness_goal,
        workout_place=data.workout_place,
        workout_time=data.workout_time,
        available_minutes_per_day=data.available_minutes_per_day,
        medical_history=data.medical_history,
        current_health_conditions=data.current_health_conditions,
        injuries=data.injuries,
        allergies=data.allergies,
        medications=data.medications,
        diet_preference=data.diet_preference,
        sync_to_calendar=data.sync_to_calendar,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    # Generate AI analysis
    user_data = {
        "age": data.age,
        "gender": data.gender,
        "height": data.height_cm,
        "weight": data.weight_kg,
        "bmi": bmi,
        "fitness_level": data.fitness_level,
        "fitness_goal": data.fitness_goal,
        "workout_place": data.workout_place,
        "workout_time": data.workout_time,
        "available_minutes": data.available_minutes_per_day,
        "medical_history": data.medical_history,
        "health_conditions": data.current_health_conditions,
        "injuries": data.injuries,
        "allergies": data.allergies,
        "medications": data.medications,
        "diet_preference": data.diet_preference,
    }

    try:
        ai_analysis = ai_agent.analyze_health_assessment(user_data)
        assessment.ai_analysis = ai_analysis
        db.commit()
        db.refresh(assessment)
    except Exception as e:
        print(f"AI analysis error: {e}")

    return {
        "success": True,
        "message": "Health assessment submitted successfully!",
        "assessment": assessment_to_dict(assessment),
        "bmi": bmi,
        "bmi_category": _bmi_category(bmi),
    }


@router.post("/analyze")
async def analyze_health(
    data: HealthAnalysisRequest,
    current_user: User = Depends(get_current_active_user),
):
    """Generate AI-powered health analysis"""
    user_data = {
        "age": data.age,
        "gender": data.gender,
        "height": data.height,
        "weight": data.weight,
        "bmi": data.bmi,
        "medical_history": data.medical_history,
        "injuries": data.injuries,
        "allergies": data.allergies,
        "medications": data.medications,
        "health_conditions": data.health_conditions,
        "fitness_level": data.fitness_level,
        "fitness_goal": data.fitness_goal,
    }

    try:
        analysis = ai_agent.analyze_health_assessment(user_data)
        return {"success": True, "analysis": analysis}
    except Exception as e:
        return {
            "success": True,
            "analysis": {
                "summary": "Based on your profile, you're ready to start a personalized fitness journey!",
                "risk_factors": [],
                "recommendations": [
                    "Start with low-intensity exercises",
                    "Stay hydrated throughout the day",
                    "Follow a balanced Indian diet",
                    "Get 7-8 hours of sleep daily",
                ],
                "fitness_readiness": "good",
                "special_considerations": [],
            },
        }


@router.get("/history")
async def get_assessment_history(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get all health assessments for current user"""
    assessments = (
        db.query(HealthAssessment)
        .filter(HealthAssessment.user_id == current_user.id)
        .order_by(HealthAssessment.created_at.desc())
        .all()
    )
    return {"assessments": [assessment_to_dict(a) for a in assessments]}


@router.get("/latest")
async def get_latest_assessment(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get the most recent health assessment"""
    assessment = (
        db.query(HealthAssessment)
        .filter(HealthAssessment.user_id == current_user.id)
        .order_by(HealthAssessment.created_at.desc())
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="No health assessment found")
    return {"assessment": assessment_to_dict(assessment)}


# ─── Utility ──────────────────────────────────────────────────────────────────

def _bmi_category(bmi: Optional[float]) -> str:
    if bmi is None:
        return "unknown"
    if bmi < 18.5:
        return "Underweight"
    elif bmi < 25:
        return "Normal"
    elif bmi < 30:
        return "Overweight"
    else:
        return "Obese"