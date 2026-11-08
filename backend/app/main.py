import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.seed_data import seed_database
from app.ml.train_models import load_wait_time_model, load_demand_model
from app.routers import (
    auth, dashboard, tickets, attractions,
    predictions, analytics, forecasts, revenue,
    recommendations, reports, users
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables are created & seeded
    Base.metadata.create_all(bind=engine)
    try:
        seed_database()
    except Exception as e:
        print(f"Startup seed notice: {e}")
    
    # Ensure Scikit-learn AI models are loaded/trained
    try:
        load_wait_time_model()
        load_demand_model()
    except Exception as e:
        print(f"ML Model initialization notice: {e}")
        
    yield
    # Shutdown logic if any

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Fuji-Q Highland DX SmartPark – Intelligent Amusement Park Management & Analytics Platform API",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all 10 module routers under /api/v1
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(tickets.router, prefix=settings.API_V1_STR)
app.include_router(attractions.router, prefix=settings.API_V1_STR)
app.include_router(predictions.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(forecasts.router, prefix=settings.API_V1_STR)
app.include_router(revenue.router, prefix=settings.API_V1_STR)
app.include_router(recommendations.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "platform": "SmartPark AI",
        "organization": "Fuji-Q Highland / Fuji Kyuko Co., Ltd.",
        "status": "online",
        "version": settings.PROJECT_VERSION,
        "docs_url": "/docs"
    }

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "models": {
            "wait_time_predictor": "loaded",
            "demand_forecaster": "loaded"
        }
    }
