"""
ArogyaMitra - AI-Driven Workout Planning, Nutrition Guidance, and Health Coaching Platform
Main FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.routers import auth, users, workouts, nutrition, progress, health_assessment, ai_coach, aromi, admin, calendar_sync
from app.utils.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🌟 Starting ArogyaMitra - AI Fitness Platform")
    print("🤖 Created by: Srinivas")
    print("🎯 Mission: Transforming Lives Through AI-Powered Fitness")
    print(f"🚀 Launching on: http://localhost:{settings.PORT}")
    Base.metadata.create_all(bind=engine)
    from app.services.ai_agent import ai_agent
    print("🤖 Initializing AI Agent...")
    print("✅ AI Agent initialized successfully!")
    yield
    # Shutdown
    print("👋 ArogyaMitra shutting down...")


app = FastAPI(
    title="ArogyaMitra API",
    description="AI-Driven Workout Planning, Nutrition Guidance, and Health Coaching Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(workouts.router, prefix="/api/workouts", tags=["Workouts"])
app.include_router(nutrition.router, prefix="/api/nutrition", tags=["Nutrition"])
app.include_router(progress.router, prefix="/api/progress", tags=["Progress"])
app.include_router(health_assessment.router, prefix="/api/health-assessment", tags=["Health Assessment"])
app.include_router(ai_coach.router, prefix="/api/ai-coach", tags=["AI Coach"])
app.include_router(aromi.router, prefix="/api/aromi", tags=["AROMI AI Coach"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(calendar_sync.router, prefix="/api/calendar", tags=["Google Calendar"])

print("✅ Auth router loaded")
print("✅ Users router loaded")
print("✅ Workouts router loaded")
print("✅ Nutrition router loaded")
print("✅ Progress router loaded")
print("✅ Admin router loaded")
print("✅ Chat router loaded")
print("✅ Health Assessment router loaded")
print("✅ AROMI AI Coach router loaded")


@app.get("/")
async def root():
    return {
        "message": "Welcome to ArogyaMitra API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ArogyaMitra API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=settings.PORT,
        reload=True,
    )