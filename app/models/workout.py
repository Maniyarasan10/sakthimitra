from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, DateTime, Float, JSON, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class WorkoutStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    SKIPPED = "skipped"

class WorkoutPlan(Base):
    __tablename__ = "workout_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    description = Column(String)
    plan_name = Column(String, nullable=True)
    week_number = Column(Integer, default=1)
    fitness_goal = Column(String)
    fitness_level = Column(String)
    workout_preference = Column(String)
    duration_minutes = Column(Integer)
    plan_data = Column(JSON)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    exercises = relationship("Exercise", back_populates="workout_plan")

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    workout_plan_id = Column(Integer, ForeignKey("workout_plans.id"))
    day_of_week = Column(String)
    name = Column(String)
    exercise_name = Column(String, nullable=True)
    sets = Column(Integer)
    reps = Column(String)
    rest_seconds = Column(Integer)
    description = Column(String)
    duration_minutes = Column(Integer, nullable=True)
    calories_burned = Column(Float, nullable=True)
    difficulty = Column(String, nullable=True)
    youtube_url = Column(String, nullable=True)
    youtube_link = Column(String, nullable=True)
    muscle_groups = Column(JSON, nullable=True)
    equipment = Column(JSON, nullable=True)
    status = Column(SQLAlchemyEnum(WorkoutStatus), default=WorkoutStatus.PENDING)
    completed_at = Column(DateTime, nullable=True)

    workout_plan = relationship("WorkoutPlan", back_populates="exercises")