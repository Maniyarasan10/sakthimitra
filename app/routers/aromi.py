"""
AROMI AI Health Companion Router
Real-time adaptive health coaching with plan adjustments
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.health import ChatSession
from app.models.workout import WorkoutPlan
from app.models.nutrition import NutritionPlan
from app.utils.auth import get_current_active_user
from app.services.ai_agent import ai_agent

router = APIRouter()


# ─── Schemas ──────────────────────────────────────────────────────────────────

class ArogyaCoachMessage(BaseModel):
    message: str
    user_status: Optional[str] = "normal"   # normal, traveling, recovering, busy
    workout_plan: Optional[dict] = None
    nutrition_plan: Optional[dict] = None
    session_id: Optional[int] = None


class DynamicPlanAdjustmentRequest(BaseModel):
    reason: str          # "travel", "health_issue", "time_constraint", etc.
    duration_days: int   # How many days will this affect
    current_plan: dict
    user_data: dict


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/aromi-chat")
async def aromi_coach_chat(
    request: ArogyaCoachMessage,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Chat with AROMI - the adaptive AI health companion"""

    # Fetch active plans for context
    active_workout = (
        db.query(WorkoutPlan)
        .filter(WorkoutPlan.user_id == current_user.id, WorkoutPlan.is_active == True)
        .first()
    )
    active_nutrition = (
        db.query(NutritionPlan)
        .filter(NutritionPlan.user_id == current_user.id, NutritionPlan.is_active == True)
        .first()
    )

    # Get or create AROMI session
    session = None
    if request.session_id:
        session = (
            db.query(ChatSession)
            .filter(
                ChatSession.id == request.session_id,
                ChatSession.user_id == current_user.id,
                ChatSession.session_type == "aromi",
            )
            .first()
        )

    if not session:
        session = ChatSession(
            user_id=current_user.id,
            session_type="aromi",
            messages=[],
            is_active=True,
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    history = session.messages or []

    user_context = {
        "name": current_user.full_name,
        "age": current_user.age,
        "gender": current_user.gender,
        "height": current_user.height,
        "weight": current_user.weight,
        "fitness_level": current_user.fitness_level,
        "fitness_goal": current_user.fitness_goal.value if current_user.fitness_goal else "maintenance",
        "diet_preference": current_user.diet_preference.value if current_user.diet_preference else "vegetarian",
        "total_workouts": current_user.total_workouts,
        "streak_points": current_user.streak_points,
        "user_status": request.user_status,
        "has_workout_plan": active_workout is not None,
        "has_nutrition_plan": active_nutrition is not None,
    }

    if active_workout:
        user_context["workout_plan_name"] = active_workout.plan_name
        user_context["workout_goal"] = active_workout.fitness_goal

    if active_nutrition:
        user_context["nutrition_target_calories"] = active_nutrition.target_calories
        user_context["nutrition_diet_type"] = active_nutrition.diet_type

    # Generate AROMI response
    try:
        aromi_response = ai_agent.aromi_chat(
            message=request.message,
            user_data=user_context,
            conversation_history=history,
            user_status=request.user_status,
        )
    except Exception as e:
        aromi_response = _fallback_aromi_response(request.message, user_context)

    timestamp = datetime.now().isoformat()

    # Save to session
    messages = list(history)
    messages.append({"role": "user", "content": request.message, "timestamp": timestamp})
    messages.append({"role": "aromi", "content": aromi_response, "timestamp": timestamp})
    if len(messages) > 30:
        messages = messages[-30:]

    session.messages = messages
    session.updated_at = datetime.now()
    db.commit()

    return {
        "response": aromi_response,
        "session_id": session.id,
        "timestamp": timestamp,
        "user_status": request.user_status,
        "plan_adjusted": False,
    }


@router.post("/adjust-plan")
async def adjust_plan_dynamically(
    request: DynamicPlanAdjustmentRequest,
    current_user: User = Depends(get_current_active_user),
):
    """Dynamically adjust workout/nutrition plan based on user situation"""
    try:
        adjustment = ai_agent.adjust_plan_dynamically(
            reason=request.reason,
            duration_days=request.duration_days,
            current_plan=request.current_plan,
            user_data=request.user_data,
        )
        return {"success": True, "adjusted_plan": adjustment, "reason": request.reason}
    except Exception as e:
        return {
            "success": True,
            "adjusted_plan": _fallback_adjustment(request.reason, request.duration_days),
            "reason": request.reason,
        }


@router.get("/session")
async def get_aromi_session(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get or create the active AROMI session"""
    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.user_id == current_user.id,
            ChatSession.session_type == "aromi",
            ChatSession.is_active == True,
        )
        .order_by(ChatSession.created_at.desc())
        .first()
    )

    if not session:
        session = ChatSession(
            user_id=current_user.id,
            session_type="aromi",
            messages=[],
            is_active=True,
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    first_name = current_user.full_name.split()[0] if current_user.full_name else "Friend"
    greeting = (
        f"🙏 Namaste! I'm AROMI, your personal health companion powered by ArogyaMitra! ❤️ "
        f"I have access to your personalized workout and nutrition plans, {first_name}. "
        "Tell me about your day, ask about your scheduled workouts and meals, "
        "or let me know if you're traveling - I'll help adjust your plans accordingly! "
        "How can I assist you today? 💪"
    )

    return {
        "session_id": session.id,
        "messages": session.messages or [],
        "greeting": greeting,
    }


@router.delete("/session/clear")
async def clear_aromi_session(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Clear AROMI chat history"""
    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.user_id == current_user.id,
            ChatSession.session_type == "aromi",
            ChatSession.is_active == True,
        )
        .first()
    )
    if session:
        session.messages = []
        db.commit()
    return {"success": True, "message": "AROMI session cleared"}


# ─── Fallbacks ────────────────────────────────────────────────────────────────

def _fallback_aromi_response(message: str, user_data: dict) -> str:
    msg = message.lower()
    name = (user_data.get("name") or "Friend").split()[0]

    if any(w in msg for w in ["snack", "snacks"]):
        return (
            f"🍎 Hey there, {name}! 😊 I've got some delicious and healthy snack ideas for you:\n\n"
            "• Roasted Makhana (150 cal)\n"
            "• Cucumber & Tomato Salad (50 cal)\n"
            "• Roasted Chana (120 cal)\n"
            "• Fresh Fruit Salad (100 cal)\n\n"
            "These align perfectly with your Indian nutrition plan! 🌿"
        )
    if any(w in msg for w in ["travel", "trip", "traveling"]):
        return (
            f"✈️ Don't worry about your fitness while traveling, {name}! I'll adjust your plan:\n\n"
            "• Replace gym workouts with hotel room exercises\n"
            "• Walking tours count as cardio!\n"
            "• Bodyweight squats, push-ups & planks work anywhere\n"
            "• Stay hydrated - drink 3L water daily\n"
            "• Look for local healthy food options 🍱"
        )
    if any(w in msg for w in ["tired", "rest", "exhausted", "fatigue"]):
        return (
            f"😴 Listen to your body, {name}! Rest is crucial for fitness gains. "
            "Take today easy - a light walk or stretching is perfect. "
            "Your muscles need recovery time to grow stronger. "
            "Tomorrow you'll be recharged! 💪"
        )
    if any(w in msg for w in ["motivat", "inspire", "encouragement"]):
        return (
            f"🔥 You've got this, {name}! Every workout brings you closer to your goals. "
            f"You've completed {user_data.get('total_workouts', 0)} workouts already - "
            "that's amazing dedication! Keep pushing forward. "
            "Every calorie burned brings hope to someone in need! ❤️"
        )
    return (
        f"💪 Great question, {name}! I'm here to support your wellness journey. "
        "Stay consistent and you'll see amazing results! "
        "Remember - every small step counts towards your transformation. 🌟"
    )


def _fallback_adjustment(reason: str, duration_days: int) -> dict:
    if reason == "travel":
        return {
            "type": "travel_adjustment",
            "duration_days": duration_days,
            "modifications": [
                "Replace gym exercises with bodyweight movements",
                "Add walking (8,000 steps/day) as cardio",
                "Hotel room workout: push-ups, squats, planks, lunges",
                "Eat local healthy options, avoid fried foods",
                "Drink 3L water daily",
            ],
            "exercises": [
                {"name": "Bodyweight Squats", "sets": 3, "reps": "20"},
                {"name": "Push-ups", "sets": 3, "reps": "15"},
                {"name": "Walking Lunges", "sets": 3, "reps": "12 each"},
                {"name": "Plank Hold", "sets": 3, "reps": "45 seconds"},
            ],
        }
    return {
        "type": "general_adjustment",
        "duration_days": duration_days,
        "modifications": [
            "Reduce intensity by 20%",
            "Focus on recovery and mobility",
            "Maintain nutrition plan",
            "Get extra rest",
        ],
    }