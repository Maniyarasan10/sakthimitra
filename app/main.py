from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, users, workouts, health_assessment, ai_coach, aromi, admin, calendar_sync

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ArogyaMitra API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(workouts.router, prefix="/workouts", tags=["Workouts"])
app.include_router(health_assessment.router, prefix="/health", tags=["Health Assessment"])
app.include_router(ai_coach.router, prefix="/coach", tags=["AI Coach"])
app.include_router(aromi.router, prefix="/aromi", tags=["AROMI Companion"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(calendar_sync.router, prefix="/calendar", tags=["Calendar Sync"])

@app.get("/")
def read_root():
    return {"message": "Welcome to ArogyaMitra API"}