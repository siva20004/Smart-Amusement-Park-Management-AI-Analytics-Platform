from datetime import datetime, date, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Ticket, Visitor, Attraction, RevenueRecord
from app.schemas import VisitorAnalyticsResponse

router = APIRouter(prefix="/analytics", tags=["Visitor Analytics"])

@router.get("/visitors", response_model=VisitorAnalyticsResponse)
def get_visitor_analytics(db: Session = Depends(get_db)):
    # 1. Daily trends (Last 30 days)
    thirty_days_ago = datetime.utcnow().date() - timedelta(days=30)
    rev_records = db.query(RevenueRecord).filter(RevenueRecord.date >= thirty_days_ago).order_by(RevenueRecord.date.asc()).all()
    
    daily_trends = [
        {
            "date": r.date.strftime("%Y-%m-%d"),
            "display_date": r.date.strftime("%b %d"),
            "visitors": r.ticket_sales_count,
            "revenue": r.total_revenue
        }
        for r in rev_records
    ]

    # 2. Hourly distribution (Typical operational day flow)
    hourly_distribution = [
        {"hour": "09:00", "visitors": 340, "congestion": "Low"},
        {"hour": "10:00", "visitors": 820, "congestion": "Moderate"},
        {"hour": "11:00", "visitors": 1450, "congestion": "High"},
        {"hour": "12:00", "visitors": 1680, "congestion": "Peak"},
        {"hour": "13:00", "visitors": 1590, "congestion": "Peak"},
        {"hour": "14:00", "visitors": 1380, "congestion": "High"},
        {"hour": "15:00", "visitors": 1120, "congestion": "Moderate"},
        {"hour": "16:00", "visitors": 890, "congestion": "Moderate"},
        {"hour": "17:00", "visitors": 640, "congestion": "Low"},
        {"hour": "18:00", "visitors": 280, "congestion": "Low"}
    ]

    # 3. Ticket category breakdown
    category_counts = db.query(Ticket.ticket_type, func.count(Ticket.id)).group_by(Ticket.ticket_type).all()
    ticket_category_breakdown = [
        {"category": cat, "count": count}
        for cat, count in category_counts
    ]

    # 4. Repeat visitor rate
    total_visitors = db.query(Visitor).count()
    repeat_count = db.query(Visitor).filter(Visitor.is_repeat_visitor == True).count()
    repeat_rate = round((repeat_count / max(1, total_visitors)) * 100, 1)

    # 5. Demographics by age
    age_counts = db.query(Visitor.age_group, func.count(Visitor.id)).group_by(Visitor.age_group).all()
    demographics_by_age = [
        {"age_group": age, "count": count}
        for age, count in age_counts
    ]

    # 6. Top popular attractions by visitor throughput today
    attractions = db.query(Attraction).order_by(Attraction.visitor_count_today.desc()).all()
    top_popular_attractions = [
        {
            "name": a.name,
            "japanese_name": a.japanese_name,
            "riders": a.visitor_count_today,
            "category": a.category,
            "wait_time": a.current_wait_time
        }
        for a in attractions
    ]

    return {
        "daily_trends": daily_trends,
        "hourly_distribution": hourly_distribution,
        "ticket_category_breakdown": ticket_category_breakdown,
        "repeat_visitor_rate": repeat_rate,
        "demographics_by_age": demographics_by_age,
        "top_popular_attractions": top_popular_attractions
    }
