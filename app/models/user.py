from sqlalchemy import Boolean, Column, Integer, String, Float, Enum
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"

class FitnessGoal(str, enum.Enum):
    WEIGHT_LOSS = "weight_loss"
    MUSCLE_GAIN = "muscle_gain"
    GENERAL_FITNESS = "general_fitness"
    STRENGTH_TRAINING = "strength_training"
    ENDURANCE = "endurance"
    MAINTENANCE = "maintenance"

class WorkoutPreference(str, enum.Enum):
    HOME = "home"
    GYM = "gym"
    OUTDOOR = "outdoor"
    MIXED = "mixed"

class DietPreference(str, enum.Enum):
    VEGETARIAN = "vegetarian"
    NON_VEGETARIAN = "non_vegetarian"
    VEGAN = "vegan"
    EGGETARIAN = "eggetarian"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    role = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    height = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)
    fitness_level = Column(String, default="beginner")
    fitness_goal = Column(Enum(FitnessGoal), default=FitnessGoal.GENERAL_FITNESS)
    workout_preference = Column(Enum(WorkoutPreference), default=WorkoutPreference.HOME)
    diet_preference = Column(Enum(DietPreference), default=DietPreference.VEGETARIAN)
    
    streak_points = Column(Integer, default=0)
    total_workouts = Column(Integer, default=0)
    charity_donations = Column(Float, default=0.0)
    
    google_calendar_connected = Column(Boolean, default=False)
    google_calendar_token = Column(String, nullable=True)
    
    profile_photo_url = Column(String, nullable=True)
    bio = Column(String, nullable=True)