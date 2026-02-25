"""
Nutrition Router - Generate meal plans, track meals, grocery list
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.nutrition import NutritionPlan, Meal
from app.utils.auth import get_current_active_user
from app.services.ai_agent import ai_agent

router = APIRouter()

DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


class GenerateNutritionRequest(BaseModel):
    diet_preference: Optional[str] = None
    allergies: Optional[str] = None
    target_calories: Optional[int] = None
    fitness_goal: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None


class MealCompleteRequest(BaseModel):
    actual_calories: Optional[int] = None
    notes: Optional[str] = None


def meal_to_dict(meal: Meal) -> dict:
    return {
        "id": meal.id,
        "day_of_week": meal.day_of_week,
        "meal_type": meal.meal_type,
        "name": meal.name,
        "description": meal.description,
        "calories": meal.calories,
        "protein_g": meal.protein_g,
        "carbs_g": meal.carbs_g,
        "fat_g": meal.fat_g,
        "fiber_g": meal.fiber_g,
        "ingredients": meal.ingredients,
        "recipe_steps": meal.recipe_steps,
        "prep_time_minutes": meal.prep_time_minutes,
        "meal_time": meal.meal_time,
        "is_completed": meal.is_completed,
        "completed_at": meal.completed_at.isoformat() if meal.completed_at else None,
    }


def plan_to_dict(plan: NutritionPlan) -> dict:
    return {
        "id": plan.id,
        "title": plan.title,
        "description": plan.description,
        "target_calories": plan.target_calories,
        "target_protein": plan.target_protein,
        "target_carbs": plan.target_carbs,
        "target_fat": plan.target_fat,
        "diet_preference": plan.diet_preference,
        "is_active": plan.is_active,
        "plan_data": plan.plan_data,
        "created_at": plan.created_at.isoformat() if plan.created_at else None,
        "meals": [meal_to_dict(m) for m in plan.meals],
    }


@router.post("/generate")
async def generate_nutrition_plan(
    request: GenerateNutritionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Generate AI-powered personalized 7-day Indian cuisine nutrition plan"""
    user_data = {
        "age": request.age or current_user.age or 25,
        "gender": request.gender or current_user.gender or "Male",
        "weight": request.weight or current_user.weight or 70,
        "height": request.height or current_user.height or 170,
        "fitness_goal": request.fitness_goal or (current_user.fitness_goal.value if current_user.fitness_goal else "general_fitness"),
        "diet_preference": request.diet_preference or (current_user.diet_preference.value if current_user.diet_preference else "vegetarian"),
        "allergies": request.allergies or "None",
        "target_calories": request.target_calories,
    }

    # Deactivate existing plans
    db.query(NutritionPlan).filter(
        NutritionPlan.user_id == current_user.id,
        NutritionPlan.is_active == True
    ).update({"is_active": False})
    db.commit()

    # Generate AI plan
    plan_data = await ai_agent.generate_nutrition_plan(user_data)

    # Calculate calorie target
    target_calories = user_data.get("target_calories") or plan_data.get("daily_calories", 2000)

    new_plan = NutritionPlan(
        user_id=current_user.id,
        title="AI Indian Nutrition Plan",
        description=f"Personalized {user_data['diet_preference']} meal plan for {user_data['fitness_goal'].replace('_', ' ')}",
        target_calories=target_calories,
        target_protein=plan_data.get("macros", {}).get("protein_g", 120),
        target_carbs=plan_data.get("macros", {}).get("carbs_g", 250),
        target_fat=plan_data.get("macros", {}).get("fat_g", 65),
        diet_preference=user_data["diet_preference"],
        plan_data=plan_data,
        is_active=True,
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)

    # Parse meals from plan_data
    weekly_meals = plan_data.get("weekly_meals", {})
    meal_type_times = {
        "Breakfast": "7:00 AM",
        "Lunch": "12:30 PM",
        "Dinner": "7:30 PM",
        "Snack": "",
        "Snack 1": "",
        "Snack 2": "",
    }

    for day in DAYS_ORDER:
        day_meals = weekly_meals.get(day, [])
        for meal_data in day_meals:
            meal_type = meal_data.get("meal_type", "Meal")
            meal = Meal(
                nutrition_plan_id=new_plan.id,
                day_of_week=day,
                meal_type=meal_type,
                name=meal_data.get("name", "Meal"),
                description=meal_data.get("description", ""),
                calories=meal_data.get("calories", 0),
                protein_g=meal_data.get("protein_g", 0),
                carbs_g=meal_data.get("carbs_g", 0),
                fat_g=meal_data.get("fat_g", 0),
                fiber_g=meal_data.get("fiber_g", 0),
                ingredients=meal_data.get("ingredients", []),
                recipe_steps=meal_data.get("recipe_steps", []),
                prep_time_minutes=meal_data.get("prep_time_minutes", 15),
                meal_time=meal_type_times.get(meal_type, ""),
            )
            db.add(meal)

    db.commit()
    db.refresh(new_plan)
    return {"message": "Nutrition plan generated successfully", "plan": plan_to_dict(new_plan)}


@router.get("/current")
async def get_current_plan(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get active nutrition plan"""
    plan = db.query(NutritionPlan).filter(
        NutritionPlan.user_id == current_user.id,
        NutritionPlan.is_active == True
    ).first()

    if not plan:
        return {"plan": None, "message": "No active nutrition plan. Please generate one."}

    return {"plan": plan_to_dict(plan)}


@router.get("/today")
async def get_todays_meals(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get today's meal plan"""
    plan = db.query(NutritionPlan).filter(
        NutritionPlan.user_id == current_user.id,
        NutritionPlan.is_active == True
    ).first()

    if not plan:
        return {"meals": [], "message": "No active nutrition plan"}

    today_name = datetime.now().strftime("%A")
    meals = db.query(Meal).filter(
        Meal.nutrition_plan_id == plan.id,
        Meal.day_of_week == today_name
    ).all()

    total_calories = sum(m.calories or 0 for m in meals)
    completed_calories = sum(m.calories or 0 for m in meals if m.is_completed)

    return {
        "day": today_name,
        "meals": [meal_to_dict(m) for m in meals],
        "summary": {
            "total_calories": total_calories,
            "consumed_calories": completed_calories,
            "remaining_calories": total_calories - completed_calories,
            "target_calories": plan.target_calories,
        }
    }


@router.get("/week")
async def get_weekly_meals(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get weekly meal plan overview"""
    plan = db.query(NutritionPlan).filter(
        NutritionPlan.user_id == current_user.id,
        NutritionPlan.is_active == True
    ).first()

    if not plan:
        return {"week": [], "message": "No active nutrition plan"}

    today_name = datetime.now().strftime("%A")
    week = []
    for day in DAYS_ORDER:
        meals = db.query(Meal).filter(
            Meal.nutrition_plan_id == plan.id,
            Meal.day_of_week == day
        ).all()
        week.append({
            "day": day,
            "is_today": day == today_name,
            "meals": [meal_to_dict(m) for m in meals],
            "total_calories": sum(m.calories or 0 for m in meals),
        })

    return {"week": week}


@router.post("/meal/{meal_id}/complete")
async def complete_meal(
    meal_id: int,
    data: MealCompleteRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark a meal as completed"""
    meal = db.query(Meal).join(NutritionPlan).filter(
        Meal.id == meal_id,
        NutritionPlan.user_id == current_user.id
    ).first()

    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    meal.is_completed = not meal.is_completed
    meal.completed_at = datetime.now() if meal.is_completed else None

    if meal.is_completed:
        from app.models.health import ProgressRecord
        record = ProgressRecord(
            user_id=current_user.id,
            record_type="nutrition",
            meals_tracked=1,
            total_calories_consumed=data.actual_calories or meal.calories,
            protein_g=meal.protein_g,
            carbs_g=meal.carbs_g,
            fat_g=meal.fat_g,
            notes=data.notes,
        )
        db.add(record)

    db.commit()
    return {
        "message": f"Meal {'completed' if meal.is_completed else 'unchecked'}",
        "meal": meal_to_dict(meal)
    }


@router.get("/grocery-list")
async def get_grocery_list(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get aggregated weekly grocery list"""
    plan = db.query(NutritionPlan).filter(
        NutritionPlan.user_id == current_user.id,
        NutritionPlan.is_active == True
    ).first()

    if not plan:
        return {"items": [], "message": "No active nutrition plan"}

    # Aggregate ingredients from all meals
    ingredient_count: dict = {}
    meals = db.query(Meal).filter(Meal.nutrition_plan_id == plan.id).all()

    for meal in meals:
        ingredients = meal.ingredients or []
        for ingredient in ingredients:
            name = ingredient if isinstance(ingredient, str) else ingredient.get("name", "")
            if name:
                ingredient_count[name] = ingredient_count.get(name, 0) + 1

    # Use plan_data grocery list if available
    plan_grocery = (plan.plan_data or {}).get("grocery_list", [])
    if plan_grocery:
        return {"items": plan_grocery}

    grocery_items = [
        {"name": name, "quantity": f"×{count}", "buy_url": f"https://www.bigbasket.com/ps/?q={name.replace(' ', '+')}"}
        for name, count in sorted(ingredient_count.items(), key=lambda x: -x[1])
    ]
    return {"items": grocery_items}