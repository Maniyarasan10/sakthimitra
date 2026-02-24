from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, DateTime, JSON, Float
from datetime import datetime
from app.database import Base

class NutritionPlan(Base):
    __tablename__ = "nutrition_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    plan_name = Column(String)
    target_calories = Column(Integer)
    diet_type = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    nutrition_plan_id = Column(Integer, ForeignKey("nutrition_plans.id"))
    day_of_week = Column(String)
    meal_type = Column(String)
    meal_name = Column(String)
    calories = Column(Integer)
    protein_g = Column(Float)
    carbs_g = Column(Float)
    fat_g = Column(Float)
    ingredients = Column(JSON)