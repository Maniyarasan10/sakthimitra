"""
Authentication Router - Login, Registration, Google OAuth
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import timedelta

from app.database import get_db
from app.models.user import User, FitnessGoal, WorkoutPreference, DietPreference
from app.utils.auth import verify_password, get_password_hash, create_access_token, get_current_active_user
from app.utils.config import settings

router = APIRouter()


# Pydantic models for request/response
class UserRegister(BaseModel):
    email: str
    username: str
    password: str
    full_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    fitness_level: Optional[str] = "beginner"
    fitness_goal: Optional[FitnessGoal] = FitnessGoal.MAINTENANCE
    workout_preference: Optional[WorkoutPreference] = WorkoutPreference.HOME
    diet_preference: Optional[DietPreference] = DietPreference.VEGETARIAN


class UserLogin(BaseModel):
    username: Optional[str] = None  # Can login with username
    email: Optional[str] = None     # Or with email
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    fitness_level: Optional[str]
    fitness_goal: Optional[str]
    workout_preference: Optional[str]
    diet_preference: Optional[str]
    streak_points: int
    total_workouts: int
    charity_donations: float
    age: Optional[int]
    gender: Optional[str]
    height: Optional[float]
    weight: Optional[float]
    google_calendar_connected: bool

    class Config:
        from_attributes = True


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        age=user_data.age,
        gender=user_data.gender,
        height=user_data.height,
        weight=user_data.weight,
        fitness_level=user_data.fitness_level or "beginner",
        fitness_goal=user_data.fitness_goal,
        workout_preference=user_data.workout_preference,
        diet_preference=user_data.diet_preference,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate token
    access_token = create_access_token(data={"sub": new_user.username})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role.value,
            "is_active": new_user.is_active,
            "fitness_level": new_user.fitness_level,
            "fitness_goal": new_user.fitness_goal.value if new_user.fitness_goal else None,
            "workout_preference": new_user.workout_preference.value if new_user.workout_preference else None,
            "diet_preference": new_user.diet_preference.value if new_user.diet_preference else None,
            "streak_points": new_user.streak_points,
            "total_workouts": new_user.total_workouts,
            "charity_donations": new_user.charity_donations,
            "age": new_user.age,
            "gender": new_user.gender,
            "height": new_user.height,
            "weight": new_user.weight,
            "google_calendar_connected": new_user.google_calendar_connected,
        }
    }


@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login with username/email and password"""
    # Find user by username or email
    user = None
    if user_data.username:
        user = db.query(User).filter(
            (User.username == user_data.username) | (User.email == user_data.username)
        ).first()
    elif user_data.email:
        user = db.query(User).filter(User.email == user_data.email).first()

    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    access_token = create_access_token(data={"sub": user.username})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "is_active": user.is_active,
            "fitness_level": user.fitness_level,
            "fitness_goal": user.fitness_goal.value if user.fitness_goal else None,
            "workout_preference": user.workout_preference.value if user.workout_preference else None,
            "diet_preference": user.diet_preference.value if user.diet_preference else None,
            "streak_points": user.streak_points,
            "total_workouts": user.total_workouts,
            "charity_donations": user.charity_donations,
            "age": user.age,
            "gender": user.gender,
            "height": user.height,
            "weight": user.weight,
            "google_calendar_connected": user.google_calendar_connected,
        }
    }


@router.post("/login/form")
async def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 compatible login for Swagger UI"""
    user = db.query(User).filter(
        (User.username == form_data.username) | (User.email == form_data.username)
    ).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_active_user)):
    """Get current authenticated user info"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
        "is_active": current_user.is_active,
        "fitness_level": current_user.fitness_level,
        "fitness_goal": current_user.fitness_goal.value if current_user.fitness_goal else None,
        "workout_preference": current_user.workout_preference.value if current_user.workout_preference else None,
        "diet_preference": current_user.diet_preference.value if current_user.diet_preference else None,
        "streak_points": current_user.streak_points,
        "total_workouts": current_user.total_workouts,
        "charity_donations": current_user.charity_donations,
        "age": current_user.age,
        "gender": current_user.gender,
        "height": current_user.height,
        "weight": current_user.weight,
        "google_calendar_connected": current_user.google_calendar_connected,
        "profile_photo_url": current_user.profile_photo_url,
        "bio": current_user.bio,
    }


@router.get("/google")
async def google_oauth_init():
    """Initiate Google OAuth2 flow"""
    from google_auth_oauthlib.flow import Flow
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CALENDAR_CLIENT_ID,
                "client_secret": settings.GOOGLE_CALENDAR_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.GOOGLE_CALENDAR_REDIRECT_URI],
            }
        },
        scopes=["https://www.googleapis.com/auth/calendar"],
    )
    flow.redirect_uri = settings.GOOGLE_CALENDAR_REDIRECT_URI
    auth_url, state = flow.authorization_url(prompt="consent")
    return {"auth_url": auth_url}


@router.get("/google/callback")
async def google_oauth_callback(code: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Handle Google OAuth callback"""
    import json
    from google_auth_oauthlib.flow import Flow
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CALENDAR_CLIENT_ID,
                "client_secret": settings.GOOGLE_CALENDAR_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.GOOGLE_CALENDAR_REDIRECT_URI],
            }
        },
        scopes=["https://www.googleapis.com/auth/calendar"],
    )
    flow.redirect_uri = settings.GOOGLE_CALENDAR_REDIRECT_URI
    flow.fetch_token(code=code)

    token_data = {
        "token": flow.credentials.token,
        "refresh_token": flow.credentials.refresh_token,
        "token_uri": flow.credentials.token_uri,
        "client_id": flow.credentials.client_id,
        "client_secret": flow.credentials.client_secret,
        "scopes": flow.credentials.scopes,
    }

    current_user.google_calendar_token = json.dumps(token_data)
    current_user.google_calendar_connected = True
    db.commit()

    return {"message": "Google Calendar connected successfully"}