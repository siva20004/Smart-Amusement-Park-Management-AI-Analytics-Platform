from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import RecommendationItem
from app.ml.recommendation_engine import generate_business_recommendations
from app.auth import get_current_user

router = APIRouter(prefix="/recommendations", tags=["AI Recommendation Engine"])

@router.get("", response_model=List[RecommendationItem])
def get_recommendations(db: Session = Depends(get_db)):
    """
    Dynamically computes AI business recommendations based on current live database values,
    queue levels, staffing requirements, and forecast models.
    """
    return generate_business_recommendations(db)
