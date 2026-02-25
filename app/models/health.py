from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, DateTime, Float, JSON
from datetime import datetime
from app.database import Base

class HealthAssessment(Base):
    __tablename__ = "health_assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    age = Column(Integer)
    gender = Column(String)
    height_cm = Column(Float)
    weight_kg = Column(Float)
    bmi = Column(Float)
    fitness_level = Column(String)
    fitness_goal = Column(String)
    workout_place = Column(String)
    workout_time = Column(String)
    available_minutes_per_day = Column(Integer)
    medical_history = Column(String, nullable=True)
    current_health_conditions = Column(String, nullable=True)
    injuries = Column(String, nullable=True)
    allergies = Column(String, nullable=True)
    medications = Column(String, nullable=True)
    diet_preference = Column(String)
    sync_to_calendar = Column(Boolean, default=False)
    ai_analysis = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    session_type = Column(String)
    messages = Column(JSON)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class ProgressRecord(Base):
    __tablename__ = "progress_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    exercise_id = Column(Integer, nullable=True)
    record_type = Column(String) # "workout", "nutrition", "weight"
    calories_burned = Column(Float, default=0.0)
    workout_duration_minutes = Column(Integer, default=0)
    exercises_completed = Column(Integer, default=0)
    sets_completed = Column(Integer, default=0)
    meals_tracked = Column(Integer, default=0)
    weight_kg = Column(Float, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)