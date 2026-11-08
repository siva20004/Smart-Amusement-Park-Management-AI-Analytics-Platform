import numpy as np
import pandas as pd
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Attraction
from app.schemas import WaitTimePredictRequest, WaitTimePredictResponse
from app.ml.train_models import load_wait_time_model

router = APIRouter(prefix="/predictions", tags=["AI Queue Predictions"])

POPULARITY_MULTIPLIERS = {
    1: 1.4, 2: 1.35, 3: 1.3, 4: 1.25, 5: 1.5,
    6: 1.1, 7: 0.9, 8: 0.85, 9: 1.0, 10: 0.8
}

@router.post("/wait-time", response_model=WaitTimePredictResponse)
def predict_wait_time(req: WaitTimePredictRequest, db: Session = Depends(get_db)):
    attr = db.query(Attraction).filter(Attraction.id == req.attraction_id).first()
    if not attr:
        raise HTTPException(status_code=404, detail="Attraction not found")
    
    if attr.status in ["maintenance", "temporarily_closed"]:
        return WaitTimePredictResponse(
            attraction_id=attr.id,
            attraction_name=attr.name,
            japanese_name=attr.japanese_name,
            predicted_wait_time_minutes=0,
            congestion_level="Inactive",
            recommended_visiting_window="Attraction currently offline for maintenance.",
            confidence_interval=[0, 0],
            factors={"status": attr.status}
        )

    # Load ML Model
    model_bundle = load_wait_time_model()
    model = model_bundle["model"]

    weather_map = {"Sunny": 0, "Cloudy": 1, "Rainy": 2}
    w_code = weather_map.get(req.weather, 0)
    pop_mult = POPULARITY_MULTIPLIERS.get(attr.id, 1.0)
    
    # Feature vector matching training columns
    features = pd.DataFrame([{
        "attraction_id": attr.id,
        "hourly_capacity": attr.hourly_capacity,
        "popularity_multiplier": pop_mult,
        "hour_of_day": req.hour_of_day,
        "day_of_week": req.day_of_week,
        "is_weekend": 1 if req.is_weekend else 0,
        "is_holiday": 1 if req.is_holiday else 0,
        "weather_code": w_code,
        "crowd_factor": req.estimated_crowd_factor
    }])

    pred = float(model.predict(features)[0])
    pred_wait = int(round(max(5.0, min(180.0, pred))))

    # Congestion Level classification
    if pred_wait < 25:
        congestion_level = "Low"
    elif pred_wait < 50:
        congestion_level = "Moderate"
    elif pred_wait < 80:
        congestion_level = "High"
    else:
        congestion_level = "Critical"

    # Recommended window logic (Early morning or late afternoon off-peak hours)
    if req.hour_of_day in range(11, 15):
        recommended_window = "09:30 - 10:45 AM or 16:30 - 17:45 PM (Lower queue density expected)"
    elif req.hour_of_day >= 17:
        recommended_window = "Immediate entry recommended before evening twilight rush."
    else:
        recommended_window = "Optimal visiting window is now (Prior to peak noon rush)."

    # Confidence interval (+/- 12%)
    ci_lower = max(5, int(pred_wait * 0.88))
    ci_upper = int(pred_wait * 1.12)

    return WaitTimePredictResponse(
        attraction_id=attr.id,
        attraction_name=attr.name,
        japanese_name=attr.japanese_name,
        predicted_wait_time_minutes=pred_wait,
        congestion_level=congestion_level,
        recommended_visiting_window=recommended_window,
        confidence_interval=[ci_lower, ci_upper],
        factors={
            "capacity": attr.hourly_capacity,
            "hour": f"{req.hour_of_day:02d}:00",
            "is_weekend": req.is_weekend,
            "is_holiday": req.is_holiday,
            "weather": req.weather,
            "crowd_factor": req.estimated_crowd_factor,
            "model_architecture": "RandomForestRegressor (100 Trees, Depth 12)"
        }
    )

@router.get("/metrics")
def get_prediction_metrics():
    model_bundle = load_wait_time_model()
    return {
        "wait_time_model": model_bundle["metrics"],
        "data_provenance": "Synthetic demonstration dataset calibrated to Fuji-Q Highland coaster telemetry."
    }
