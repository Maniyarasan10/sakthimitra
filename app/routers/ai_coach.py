"""
AI Fitness Coach Router
Chat-based AI coaching powered by Groq LLaMA-3.3-70B
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.health import ChatSession
from app.utils.auth import get_current_active_user
from app.services.ai_agent import ai_agent

router = APIRouter()


# ─── Schemas ──────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[int] = None


class ChatResponse(BaseModel):
    response: str
    session_id: int
    timestamp: str


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/chat")
async def chat_with_coach(
    request: ChatMessage,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Send a message to the AI Fitness Coach"""

    # Get or create session
    session = None
    if request.session_id:
        session = (
            db.query(ChatSession)
            .filter(
                ChatSession.id == request.session_id,
                ChatSession.user_id == current_user.id,
                ChatSession.session_type == "ai_coach",
            )
            .first()
        )

    if not session:
        session = ChatSession(
            user_id=current_user.id,
            session_type="ai_coach",
            messages=[],
            is_active=True,
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    # Build conversation history
    history = session.messages or []

    # Build user context
    user_context = {
        "name": current_user.full_name,
        "age": current_user.age,
        "gender": current_user.gender,
        "height": current_user.height,
        "weight": current_user.weight,
        "fitness_level": current_user.fitness_level,
        "fitness_goal": current_user.fitness_goal.value if current_user.fitness_goal else "maintenance",
        "workout_preference": current_user.workout_preference.value if current_user.workout_preference else "home",
        "diet_preference": current_user.diet_preference.value if current_user.diet_preference else "vegetarian",
        "total_workouts": current_user.total_workouts,
        "streak_points": current_user.streak_points,
    }

    # Generate AI response
    try:
        ai_response = ai_agent.coach_chat(
            message=request.message,
            user_data=user_context,
            conversation_history=history,
        )
    except Exception as e:
        ai_response = _fallback_coach_response(request.message, user_context)

    timestamp = datetime.now().isoformat()

    # Append messages to session
    messages = list(history)
    messages.append({"role": "user", "content": request.message, "timestamp": timestamp})
    messages.append({"role": "assistant", "content": ai_response, "timestamp": timestamp})

    # Keep only last 20 messages to avoid DB bloat
    if len(messages) > 20:
        messages = messages[-20:]

    session.messages = messages
    session.updated_at = datetime.now()
    db.commit()

    return {
        "response": ai_response,
        "session_id": session.id,
        "timestamp": timestamp,
    }


@router.get("/sessions")
async def get_chat_sessions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get all AI coach chat sessions"""
    sessions = (
        db.query(ChatSession)
        .filter(
            ChatSession.user_id == current_user.id,
            ChatSession.session_type == "ai_coach",
        )
        .order_by(ChatSession.created_at.desc())
        .limit(10)
        .all()
    )
    return {
        "sessions": [
            {
                "id": s.id,
                "message_count": len(s.messages or []),
                "is_active": s.is_active,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "updated_at": s.updated_at.isoformat() if s.updated_at else None,
                "last_message": (s.messages[-1]["content"][:80] + "...") if s.messages else "",
            }
            for s in sessions
        ]
    }


@router.get("/sessions/{session_id}/messages")
async def get_session_messages(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get messages for a specific session"""
    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
        )
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"session_id": session_id, "messages": session.messages or []}


@router.post("/new-session")
async def start_new_session(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Start a fresh coaching session"""
    # Deactivate old sessions
    db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id,
        ChatSession.session_type == "ai_coach",
        ChatSession.is_active == True,
    ).update({"is_active": False})

    session = ChatSession(
        user_id=current_user.id,
        session_type="ai_coach",
        messages=[],
        is_active=True,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    greeting = (
        f"Hi {current_user.full_name.split()[0]}! 👋 I'm your AI fitness coach. "
        "I'm here to help you with workout plans, nutrition advice, and motivation. "
        "What would you like to know?"
    )
    return {"session_id": session.id, "greeting": greeting}


# ─── Fallback ─────────────────────────────────────────────────────────────────

def _fallback_coach_response(message: str, user_data: dict) -> str:
    msg = message.lower()
    name = (user_data.get("name") or "Friend").split()[0]

    if any(w in msg for w in ["travel", "trip", "hotel"]):
        return (
            f"🌍 No worries {name}! Here's your travel workout:\n\n"
            "• Bodyweight squats (3×20)\n• Push-ups (3×15)\n"
            "• Lunges (3×12 each leg)\n• Plank holds (3×45s)\n\n"
            "No equipment needed! Stay hydrated and get 7-8 hours of sleep. 💪"
        )
    if any(w in msg for w in ["calori", "nutri", "eat", "diet", "food"]):
        return (
            "🥗 Based on your profile I recommend 1800-2000 calories daily:\n\n"
            "• Protein: 120-150g (chicken, fish, dal, paneer)\n"
            "• Carbs: 200-250g (brown rice, roti, oats)\n"
            "• Fats: 50-70g (nuts, olive oil)\n\n"
            "Drink 2.5-3 litres of water daily! 💧"
        )
    if any(w in msg for w in ["morning", "routine", "wake"]):
        return (
            "🌅 Perfect morning routine:\n\n"
            "6:00 AM – Wake up & drink 500ml water\n"
            "6:10 AM – 5 min stretching\n"
            "6:15 AM – 30 min workout\n"
            "6:50 AM – Cool down\n"
            "7:00 AM – Healthy breakfast\n\n"
            "Consistency is key! Start tomorrow! ✨"
        )
    if any(w in msg for w in ["muscle", "gain", "bulk"]):
        return (
            "💪 For muscle gain:\n\n"
            "• Caloric surplus: +300-500 cal/day\n"
            "• High protein: 1.6-2.2g per kg bodyweight\n"
            "• Progressive overload training\n"
            "• 7-9 hours sleep (muscle builds at rest!)\n"
            "• Key lifts: Squats, deadlifts, bench press"
        )
    return (
        f"Great question {name}! 🎯 Based on your fitness profile, I recommend "
        "staying consistent with your training and nutrition plan. "
        "Progress over perfection! 💪✨"
    )