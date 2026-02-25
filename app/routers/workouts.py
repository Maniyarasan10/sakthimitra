"""
Workouts Router - Generate, retrieve, complete workout plans
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.workout import WorkoutPlan, Exercise, WorkoutStatus
from app.utils.auth import get_current_active_user
from app.services.ai_agent import ai_agent

router = APIRouter()

DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


class GenerateWorkoutRequest(BaseModel):
    fitness_goal: Optional[str] = None
    fitness_level: Optional[str] = None
    workout_preference: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    medical_history: Optional[str] = None
    injuries: Optional[str] = None
    available_minutes: Optional[int] = 45
    workout_time: Optional[str] = "Morning"


class CompleteExerciseRequest(BaseModel):
    calories_burned: Optional[float] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None


def exercise_to_dict(ex: Exercise) -> dict:
    return {
        "id": ex.id,
        "day_of_week": ex.day_of_week,
        "name": ex.name,
        "description": ex.description,
        "sets": ex.sets,
        "reps": ex.reps,
        "rest_seconds": ex.rest_seconds,
        "duration_minutes": ex.duration_minutes,
        "calories_burned": ex.calories_burned,
        "difficulty": ex.difficulty,
        "youtube_url": ex.youtube_url,
        "muscle_groups": ex.muscle_groups,
        "equipment": ex.equipment,
        "status": ex.status.value,
        "completed_at": ex.completed_at.isoformat() if ex.completed_at else None,
    }


def plan_to_dict(plan: WorkoutPlan) -> dict:
    return {
        "id": plan.id,
        "title": plan.title,
        "description": plan.description,
        "week_number": plan.week_number,
        "fitness_goal": plan.fitness_goal,
        "fitness_level": plan.fitness_level,
        "workout_preference": plan.workout_preference,
        "plan_data": plan.plan_data,
        "is_active": plan.is_active,
        "created_at": plan.created_at.isoformat() if plan.created_at else None,
        "exercises": [exercise_to_dict(e) for e in plan.exercises],
    }


@router.post("/generate")
async def generate_workout_plan(
    request: GenerateWorkoutRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Generate AI-powered personalized 7-day workout plan"""
    user_data = {
        "age": request.age or current_user.age or 25,
        "gender": request.gender or current_user.gender or "Male",
        "height": request.height or current_user.height or 170,
        "weight": request.weight or current_user.weight or 70,
        "fitness_level": request.fitness_level or current_user.fitness_level or "beginner",
        "fitness_goal": request.fitness_goal or (current_user.fitness_goal.value if current_user.fitness_goal else "general_fitness"),
        "workout_preference": request.workout_preference or (current_user.workout_preference.value if current_user.workout_preference else "home"),
        "medical_history": request.medical_history or "None",
        "injuries": request.injuries or "None",
        "available_minutes": request.available_minutes or 45,
        "workout_time": request.workout_time or "Morning",
    }

    # Deactivate existing plans
    db.query(WorkoutPlan).filter(
        WorkoutPlan.user_id == current_user.id,
        WorkoutPlan.is_active == True
    ).update({"is_active": False})
    db.commit()

    # Generate AI plan
    plan_data = await ai_agent.generate_workout_plan(user_data)

    # Create plan in DB
    new_plan = WorkoutPlan(
        user_id=current_user.id,
        title=f"AI Workout Plan - Week {1}",
        description=f"Personalized {user_data['fitness_goal'].replace('_', ' ').title()} plan",
        fitness_goal=user_data["fitness_goal"],
        fitness_level=user_data["fitness_level"],
        workout_preference=user_data["workout_preference"],
        plan_data=plan_data,
        is_active=True,
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)

    # Parse exercises from plan_data and save them
    weekly_schedule = plan_data.get("weekly_schedule", {})
    for day in DAYS_ORDER:
        day_data = weekly_schedule.get(day, {})
        if day_data.get("is_rest_day"):
            continue
        exercises_list = day_data.get("exercises", [])
        for ex_data in exercises_list:
            exercise = Exercise(
                workout_plan_id=new_plan.id,
                day_of_week=day,
                name=ex_data.get("name", "Exercise"),
                description=ex_data.get("description", ""),
                sets=ex_data.get("sets", 3),
                reps=str(ex_data.get("reps", "12")),
                rest_seconds=ex_data.get("rest_seconds", 60),
                duration_minutes=ex_data.get("duration_minutes"),
                calories_burned=ex_data.get("calories_burned"),
                difficulty=ex_data.get("difficulty", user_data["fitness_level"]),
                youtube_url=ex_data.get("youtube_url"),
                muscle_groups=ex_data.get("muscle_groups", []),
                equipment=ex_data.get("equipment", []),
            )
            db.add(exercise)

    db.commit()
    db.refresh(new_plan)
    return {"message": "Workout plan generated successfully", "plan": plan_to_dict(new_plan)}


@router.get("/current")
async def get_current_plan(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's active workout plan"""
    plan = db.query(WorkoutPlan).filter(
        WorkoutPlan.user_id == current_user.id,
        WorkoutPlan.is_active == True
    ).first()

    if not plan:
        return {"plan": None, "message": "No active workout plan. Please generate one."}

    return {"plan": plan_to_dict(plan)}


@router.get("/today")
async def get_todays_workout(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get today's workout exercises"""
    plan = db.query(WorkoutPlan).filter(
        WorkoutPlan.user_id == current_user.id,
        WorkoutPlan.is_active == True
    ).first()

    if not plan:
        return {"today": None, "exercises": [], "message": "No active plan. Please complete health assessment."}

    today_name = datetime.now().strftime("%A")  # e.g. "Thursday"

    exercises = db.query(Exercise).filter(
        Exercise.workout_plan_id == plan.id,
        Exercise.day_of_week == today_name
    ).all()

    plan_data = plan.plan_data or {}
    today_data = plan_data.get("weekly_schedule", {}).get(today_name, {})

    return {
        "day": today_name,
        "focus": today_data.get("focus", "Workout"),
        "duration_minutes": today_data.get("duration_minutes", 45),
        "is_rest_day": today_data.get("is_rest_day", False),
        "warmup": today_data.get("warm_up", "5-minute jogging in place or jumping jacks"),
        "cooldown": today_data.get("cool_down", "5-minute stretching"),
        "recommended_time": today_data.get("recommended_time", "6:00 AM - 7:00 AM"),
        "exercises": [exercise_to_dict(e) for e in exercises],
    }


@router.get("/week")
async def get_weekly_plan(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get weekly workout overview"""
    plan = db.query(WorkoutPlan).filter(
        WorkoutPlan.user_id == current_user.id,
        WorkoutPlan.is_active == True
    ).first()

    if not plan:
        return {"week": [], "message": "No active plan found"}

    today_name = datetime.now().strftime("%A")
    plan_data = plan.plan_data or {}
    weekly = plan_data.get("weekly_schedule", {})

    week_summary = []
    for day in DAYS_ORDER:
        day_data = weekly.get(day, {})
        exercises = db.query(Exercise).filter(
            Exercise.workout_plan_id == plan.id,
            Exercise.day_of_week == day
        ).all()

        completed = sum(1 for e in exercises if e.status == WorkoutStatus.COMPLETED)
        week_summary.append({
            "day": day,
            "is_today": day == today_name,
            "focus": day_data.get("focus", "Rest Day" if day_data.get("is_rest_day") else "Workout"),
            "duration_minutes": day_data.get("duration_minutes", 0),
            "exercise_count": len(exercises),
            "completed_count": completed,
            "is_rest_day": day_data.get("is_rest_day", False),
            "recommended_time": day_data.get("recommended_time", ""),
        })

    return {"week": week_summary, "plan_title": plan.title}


@router.post("/exercise/{exercise_id}/complete")
async def complete_exercise(
    exercise_id: int,
    data: CompleteExerciseRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark an exercise as completed"""
    exercise = db.query(Exercise).join(WorkoutPlan).filter(
        Exercise.id == exercise_id,
        WorkoutPlan.user_id == current_user.id
    ).first()

    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    exercise.status = WorkoutStatus.COMPLETED
    exercise.completed_at = datetime.now()
    if data.calories_burned:
        exercise.calories_burned = data.calories_burned

    # Log progress record
    from app.models.health import ProgressRecord
    record = ProgressRecord(
        user_id=current_user.id,
        exercise_id=exercise_id,
        record_type="workout",
        calories_burned=data.calories_burned or exercise.calories_burned or 14,
        workout_duration_minutes=data.duration_minutes or exercise.duration_minutes or 10,
        exercises_completed=1,
        sets_completed=exercise.sets,
        notes=data.notes,
    )
    db.add(record)

    # Update user total workouts (count distinct days completed)
    today = datetime.now().date()
    today_records = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == current_user.id,
        ProgressRecord.record_type == "workout",
    ).all()
    unique_days = {r.created_at.date() for r in today_records if r.created_at}
    current_user.total_workouts = len(unique_days)
    current_user.streak_points = current_user.streak_points + 10

    db.commit()
    return {"message": "Exercise completed!", "exercise": exercise_to_dict(exercise)}


@router.get("/history")
async def get_workout_history(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all workout plans history"""
    plans = db.query(WorkoutPlan).filter(
        WorkoutPlan.user_id == current_user.id
    ).order_by(WorkoutPlan.created_at.desc()).limit(10).all()

    return {"plans": [plan_to_dict(p) for p in plans]}


@router.get("/youtube/{exercise_name}")
async def get_youtube_video(
    exercise_name: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get YouTube video URL for an exercise"""
    from app.services.youtube_service import youtube_service
    video = await youtube_service.search_exercise_video(exercise_name)
    return video