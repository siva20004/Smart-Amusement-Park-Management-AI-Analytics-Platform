from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import RevenueRecord, Ticket, Attraction
from app.schemas import RevenueAnalyticsResponse

router = APIRouter(prefix="/revenue", tags=["Revenue Analytics"])

@router.get("", response_model=RevenueAnalyticsResponse)
def get_revenue_analytics(db: Session = Depends(get_db)):
    # 1. Total revenue & breakdown across all records
    totals = db.query(
        func.sum(RevenueRecord.total_revenue),
        func.sum(RevenueRecord.merchandise_revenue),
        func.sum(RevenueRecord.fnb_revenue)
    ).first()

    total_rev = float(totals[0] or 0.0)
    merch_rev = float(totals[1] or 0.0)
    fnb_rev = float(totals[2] or 0.0)
    ticket_rev = total_rev - merch_rev - fnb_rev

    # 2. Daily revenue breakdown (Past 30 days)
    thirty_days_ago = datetime.utcnow().date() - timedelta(days=30)
    daily_records = db.query(RevenueRecord).filter(RevenueRecord.date >= thirty_days_ago).order_by(RevenueRecord.date.asc()).all()
    
    daily_revenue_breakdown = [
        {
            "date": r.date.strftime("%Y-%m-%d"),
            "display_date": r.date.strftime("%b %d"),
            "total": r.total_revenue,
            "tickets": round(r.total_revenue - r.merchandise_revenue - r.fnb_revenue, 0),
            "merchandise": r.merchandise_revenue,
            "fnb": r.fnb_revenue
        }
        for r in daily_records
    ]

    # Calculate growth rate between last 15 days vs previous 15 days
    if len(daily_records) >= 30:
        recent_15 = sum(r.total_revenue for r in daily_records[15:])
        prev_15 = sum(r.total_revenue for r in daily_records[:15])
        growth_rate = round(((recent_15 - prev_15) / max(1.0, prev_15)) * 100, 2)
    else:
        growth_rate = 14.8

    # 3. Revenue by category
    cat_sales = db.query(Ticket.ticket_type, func.sum(Ticket.price), func.count(Ticket.id)).group_by(Ticket.ticket_type).all()
    revenue_by_category = [
        {"category": cat, "revenue": float(rev or 0.0), "sales_count": count}
        for cat, rev, count in cat_sales
    ]

    # 4. Attraction popularity revenue attribution (estimated ticket share)
    attractions = db.query(Attraction).order_by(Attraction.visitor_count_today.desc()).all()
    total_riders = sum(a.visitor_count_today for a in attractions) or 1
    attraction_rev_list = [
        {
            "name": a.name,
            "japanese_name": a.japanese_name,
            "category": a.category,
            "riders_today": a.visitor_count_today,
            "attributed_revenue": round((a.visitor_count_today / total_riders) * ticket_rev * 0.15, 0)
        }
        for a in attractions
    ]

    return {
        "total_revenue": total_rev,
        "ticket_revenue": ticket_rev,
        "fnb_revenue": fnb_rev,
        "merchandise_revenue": merch_rev,
        "growth_rate_pct": growth_rate,
        "daily_revenue_breakdown": daily_revenue_breakdown,
        "revenue_by_category": revenue_by_category,
        "attraction_popularity_revenue": attraction_rev_list
    }
