import os
import pickle
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler

ML_DIR = os.path.dirname(os.path.abspath(__file__))
WAIT_TIME_MODEL_PATH = os.path.join(ML_DIR, "wait_time_model.pkl")
DEMAND_MODEL_PATH = os.path.join(ML_DIR, "demand_model.pkl")

def generate_synthetic_wait_time_training_data(n_samples=10000):
    """
    Generates realistic queue dynamics for amusement park attractions
    inspired by Fuji-Q Highland coasters (Fujiyama, Eejanaika, Takabisha, etc.).
    """
    np.random.seed(42)
    
    # 10 attractions with varying capacities & popularity
    attraction_ids = np.random.choice(range(1, 11), size=n_samples)
    hourly_capacities = {
        1: 1200, 2: 1000, 3: 850, 4: 950, 5: 600,
        6: 1100, 7: 750, 8: 700, 9: 900, 10: 800
    }
    popularity_multipliers = {
        1: 1.4, 2: 1.35, 3: 1.3, 4: 1.25, 5: 1.5,  # Top thrill & horror coasters
        6: 1.1, 7: 0.9, 8: 0.85, 9: 1.0, 10: 0.8
    }

    hours = np.random.randint(9, 21, size=n_samples) # 9 AM to 8 PM
    day_of_weeks = np.random.randint(0, 7, size=n_samples)
    is_weekends = (day_of_weeks >= 5).astype(int)
    is_holidays = np.random.choice([0, 1], p=[0.92, 0.08], size=n_samples)
    weather_codes = np.random.choice([0, 1, 2], p=[0.70, 0.20, 0.10], size=n_samples) # 0: Sunny, 1: Cloudy, 2: Rainy
    crowd_factors = np.random.uniform(0.5, 2.5, size=n_samples)

    # Base wait times influenced by peak diurnal curves (peak between 11 AM and 3 PM)
    peak_curve = np.exp(-((hours - 13.5) ** 2) / 12)
    weekend_boost = is_weekends * 25.0
    holiday_boost = is_holidays * 35.0
    weather_penalty = np.where(weather_codes == 2, -15.0, 0.0)

    wait_times = []
    for i in range(n_samples):
        aid = attraction_ids[i]
        pop = popularity_multipliers[aid]
        cap = hourly_capacities[aid]
        
        # Physics of queueing: Arrival rate vs Service rate
        base = 25 * pop * (1000 / cap) * (1.0 + peak_curve[i] * 1.5) * crowd_factors[i]
        total_wait = base + weekend_boost[i] + holiday_boost[i] + weather_penalty[i] + np.random.normal(0, 5)
        total_wait = max(5.0, min(180.0, total_wait))
        wait_times.append(round(total_wait, 1))

    df = pd.DataFrame({
        "attraction_id": attraction_ids,
        "hourly_capacity": [hourly_capacities[aid] for aid in attraction_ids],
        "popularity_multiplier": [popularity_multipliers[aid] for aid in attraction_ids],
        "hour_of_day": hours,
        "day_of_week": day_of_weeks,
        "is_weekend": is_weekends,
        "is_holiday": is_holidays,
        "weather_code": weather_codes,
        "crowd_factor": crowd_factors,
        "wait_time_minutes": wait_times
    })
    return df

def generate_synthetic_demand_training_data(n_days=730):
    """
    Generates 2 years of daily attendance data capturing seasonal peaks (Summer, Golden Week,
    Silver Week, Autumn foliage, New Year) and weather impacts for Fuji-Q Highland.
    """
    np.random.seed(101)
    base_date = datetime(2024, 1, 1)
    dates = [base_date + timedelta(days=i) for i in range(n_days)]
    
    day_of_weeks = [d.weekday() for d in dates]
    months = [d.month for d in dates]
    is_weekends = [1 if dow >= 5 else 0 for dow in day_of_weeks]
    
    # Japanese national holiday approximation
    is_holidays = []
    for d in dates:
        # Golden week (early May), Obon (mid August), Silver week (late Sept)
        if (d.month == 5 and 1 <= d.day <= 6) or (d.month == 8 and 11 <= d.day <= 16) or (d.month == 9 and 19 <= d.day <= 23) or (d.month == 1 and 1 <= d.day <= 3):
            is_holidays.append(1)
        else:
            is_holidays.append(1 if np.random.rand() < 0.05 else 0)
    
    temperatures = [15 + 12 * np.sin((m - 3) * np.pi / 6) + np.random.normal(0, 3) for m in months]
    rain_mm = [np.random.exponential(4.0) if np.random.rand() > 0.65 else 0.0 for _ in dates]

    visitors = []
    for i in range(n_days):
        dow = day_of_weeks[i]
        m = months[i]
        is_wk = is_weekends[i]
        is_hol = is_holidays[i]
        rain = rain_mm[i]

        # Base weekday visitors: 4,500 - 6,500
        base = 5200
        # Weekend bump: +50% - 90%
        if is_wk:
            base += 3800
        # Holiday bump: +5,000
        if is_hol:
            base += 4800
        # Summer peak (July/August) & Autumn (October)
        if m in [7, 8]:
            base += 2500
        elif m in [9, 10]:
            base += 1800
        elif m in [1, 2]:
            base -= 1200 # Cold winter at Mt. Fuji base
        
        # Rain penalty
        if rain > 5.0:
            base -= min(3000, rain * 150)

        # Random operational variation
        base += np.random.normal(0, 300)
        daily_visitors = int(max(1500, base))
        visitors.append(daily_visitors)

    df = pd.DataFrame({
        "day_of_week": day_of_weeks,
        "month": months,
        "is_weekend": is_weekends,
        "is_holiday": is_holidays,
        "temperature": temperatures,
        "rain_mm": rain_mm,
        "visitors": visitors
    })
    return df

def train_all_models():
    """
    Trains and saves both Scikit-learn models:
    1. Wait Time Predictor (RandomForestRegressor)
    2. Daily Demand Forecaster (GradientBoostingRegressor)
    """
    print("[AI/ML Engine] Training Queue Wait Time Prediction Model...")
    df_wait = generate_synthetic_wait_time_training_data()
    X_wait = df_wait[[
        "attraction_id", "hourly_capacity", "popularity_multiplier",
        "hour_of_day", "day_of_week", "is_weekend", "is_holiday",
        "weather_code", "crowd_factor"
    ]]
    y_wait = df_wait["wait_time_minutes"]

    X_train_w, X_test_w, y_train_w, y_test_w = train_test_split(X_wait, y_wait, test_size=0.2, random_state=42)
    rf_wait = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1)
    rf_wait.fit(X_train_w, y_train_w)

    y_pred_w = rf_wait.predict(X_test_w)
    wait_metrics = {
        "model_name": "RandomForestRegressor (Attraction Queue Time)",
        "mae_minutes": round(float(mean_absolute_error(y_test_w, y_pred_w)), 2),
        "rmse_minutes": round(float(np.sqrt(mean_squared_error(y_test_w, y_pred_w))), 2),
        "r2_score": round(float(r2_score(y_test_w, y_pred_w)), 3),
        "trained_samples": len(df_wait),
        "trained_at": datetime.utcnow().isoformat()
    }

    with open(WAIT_TIME_MODEL_PATH, "wb") as f:
        pickle.dump({"model": rf_wait, "metrics": wait_metrics}, f)
    print(f"[AI/ML Engine] Wait Time Model saved. R2: {wait_metrics['r2_score']}, MAE: {wait_metrics['mae_minutes']} min")

    print("[AI/ML Engine] Training Visitor Demand Forecasting Model...")
    df_demand = generate_synthetic_demand_training_data()
    X_demand = df_demand[["day_of_week", "month", "is_weekend", "is_holiday", "temperature", "rain_mm"]]
    y_demand = df_demand["visitors"]

    X_train_d, X_test_d, y_train_d, y_test_d = train_test_split(X_demand, y_demand, test_size=0.2, random_state=42)
    gb_demand = GradientBoostingRegressor(n_estimators=120, learning_rate=0.08, max_depth=5, random_state=42)
    gb_demand.fit(X_train_d, y_train_d)

    y_pred_d = gb_demand.predict(X_test_d)
    demand_metrics = {
        "model_name": "GradientBoostingRegressor (Daily Park Attendance)",
        "mae_visitors": round(float(mean_absolute_error(y_test_d, y_pred_d)), 1),
        "rmse_visitors": round(float(np.sqrt(mean_squared_error(y_test_d, y_pred_d))), 1),
        "r2_score": round(float(r2_score(y_test_d, y_pred_d)), 3),
        "trained_samples": len(df_demand),
        "trained_at": datetime.utcnow().isoformat()
    }

    with open(DEMAND_MODEL_PATH, "wb") as f:
        pickle.dump({"model": gb_demand, "metrics": demand_metrics}, f)
    print(f"[AI/ML Engine] Demand Forecast Model saved. R2: {demand_metrics['r2_score']}, MAE: {demand_metrics['mae_visitors']} visitors")

    return wait_metrics, demand_metrics

def load_wait_time_model():
    if not os.path.exists(WAIT_TIME_MODEL_PATH):
        train_all_models()
    with open(WAIT_TIME_MODEL_PATH, "rb") as f:
        return pickle.load(f)

def load_demand_model():
    if not os.path.exists(DEMAND_MODEL_PATH):
        train_all_models()
    with open(DEMAND_MODEL_PATH, "rb") as f:
        return pickle.load(f)

if __name__ == "__main__":
    train_all_models()
