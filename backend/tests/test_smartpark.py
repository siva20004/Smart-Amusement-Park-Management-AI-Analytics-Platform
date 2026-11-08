import pytest
from datetime import datetime, date, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Ticket, User

client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "wait_time_predictor" in data["models"]

def test_login_admin_and_staff():
    # Admin login
    admin_resp = client.post("/api/v1/auth/login", json={
        "email": "admin@fujiq.jp",
        "password": "Admin@FujiQ2026!"
    })
    assert admin_resp.status_code == 200
    admin_data = admin_resp.json()
    assert "access_token" in admin_data
    assert admin_data["user"]["role"] == "admin"

    # Staff login
    staff_resp = client.post("/api/v1/auth/login", json={
        "email": "staff@fujiq.jp",
        "password": "Staff@FujiQ2026!"
    })
    assert staff_resp.status_code == 200
    staff_data = staff_resp.json()
    assert staff_data["user"]["role"] == "staff"

    # Invalid login test
    bad_resp = client.post("/api/v1/auth/login", json={
        "email": "admin@fujiq.jp",
        "password": "WrongPassword!"
    })
    assert bad_resp.status_code == 401

def test_dashboard_summary():
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_visitors_today"] > 0
    assert data["total_attractions_count"] == 10
    assert len(data["visitor_distribution_by_attraction"]) == 10
    assert len(data["daily_visitor_trend"]) > 0

def test_ticket_lifecycle_and_duplicate_prevention():
    # 1. Staff login to get token
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "staff@fujiq.jp",
        "password": "Staff@FujiQ2026!"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create digital ticket
    ticket_payload = {
        "visitor_name": "Taro Yamada (山田 太郎)",
        "visitor_email": f"taro.yamada.{datetime.utcnow().timestamp()}@fujiq-guest.jp",
        "visitor_phone": "+81-90-1234-5678",
        "ticket_type": "Adult",
        "visit_date": str(datetime.utcnow().date())
    }
    create_resp = client.post("/api/v1/tickets", json=ticket_payload, headers=headers)
    assert create_resp.status_code == 200
    ticket = create_resp.json()
    assert ticket["status"] == "valid"
    assert ticket["booking_ref"].startswith("FQ-2026-")
    assert ticket["qr_code_data"].startswith("data:image/png;base64,")

    booking_ref = ticket["booking_ref"]

    # 3. First Verification: Must succeed
    verify_payload = {
        "qr_code_or_booking_ref": booking_ref,
        "gate_id": "Main Entrance - Gate 1"
    }
    first_verify = client.post("/api/v1/tickets/verify", json=verify_payload, headers=headers)
    assert first_verify.status_code == 200
    first_data = first_verify.json()
    assert first_data["status"] == "success"
    assert "ADMISSION GRANTED" in first_data["message"]
    assert first_data["ticket"]["status"] == "used"

    # 4. DUPLICATE PREVENTION: Second Verification must be REJECTED!
    second_verify = client.post("/api/v1/tickets/verify", json=verify_payload, headers=headers)
    assert second_verify.status_code == 200
    second_data = second_verify.json()
    assert second_data["status"] == "rejected_duplicate"
    assert "DUPLICATE PRESENTATION" in second_data["message"]
    assert second_data["previous_verification_time"] is not None

def test_attractions_management():
    # List attractions
    response = client.get("/api/v1/attractions")
    assert response.status_code == 200
    attractions = response.json()
    assert len(attractions) >= 10
    
    # Filter by category
    roller_coasters = client.get("/api/v1/attractions?category=roller_coaster").json()
    assert len(roller_coasters) >= 4

    # Staff status toggle
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "staff@fujiq.jp",
        "password": "Staff@FujiQ2026!"
    })
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}
    
    attr_id = attractions[0]["id"]
    status_resp = client.patch(f"/api/v1/attractions/{attr_id}/status?status=maintenance", headers=headers)
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == "maintenance"

    # Revert back to operational
    client.patch(f"/api/v1/attractions/{attr_id}/status?status=operational", headers=headers)

def test_ai_wait_time_prediction():
    payload = {
        "attraction_id": 1, # FUJIYAMA
        "hour_of_day": 13,  # 1 PM Peak
        "day_of_week": 5,   # Saturday
        "is_weekend": True,
        "is_holiday": False,
        "weather": "Sunny",
        "estimated_crowd_factor": 1.4
    }
    resp = client.post("/api/v1/predictions/wait-time", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["predicted_wait_time_minutes"] > 15
    assert data["congestion_level"] in ["Low", "Moderate", "High", "Critical"]
    assert len(data["confidence_interval"]) == 2

def test_ai_demand_forecasting():
    resp = client.get("/api/v1/forecasts")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["seven_day_forecast"]) == 7
    assert data["next_day_forecast"]["predicted_visitors"] > 0
    assert data["model_metrics"]["r2_score"] > 0.85

def test_ai_business_recommendations():
    resp = client.get("/api/v1/recommendations")
    assert resp.status_code == 200
    recs = resp.json()
    assert len(recs) > 0
    assert "category" in recs[0]
    assert "urgency" in recs[0]
    assert "recommended_action" in recs[0]

def test_automated_report_generation():
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "admin@fujiq.jp",
        "password": "Admin@FujiQ2026!"
    })
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    for fmt in ["csv", "xlsx", "pdf"]:
        req = {
            "report_type": "daily_ops",
            "file_format": fmt
        }
        gen_resp = client.post("/api/v1/reports/generate", json=req, headers=headers)
        assert gen_resp.status_code == 200
        rep_data = gen_resp.json()
        assert rep_data["file_format"] == fmt

        # Test download
        dl_resp = client.get(f"/api/v1/reports/{rep_data['id']}/download")
        assert dl_resp.status_code == 200
        assert len(dl_resp.content) > 0
