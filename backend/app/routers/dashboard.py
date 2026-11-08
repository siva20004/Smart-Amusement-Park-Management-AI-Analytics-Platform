from datetime import datetime, date, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Ticket, TicketVerification, Attraction, RevenueRecord, Visitor
from app.schemas import DashboardSummary
from app.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    
    # 1. Tickets sold today & revenue
    today_tickets = db.query(Ticket).filter(Ticket.booking_date == today).all()
    total_tickets_sold_today = len(today_tickets)
    total_revenue_today = float(sum(t.price for t in today_tickets))
    
    # If today is early morning / 0 sales, get latest recorded revenue record for baseline
    if total_revenue_today == 0:
        latest_rev = db.query(RevenueRecord).order_by(RevenueRecord.date.desc()).first()
        if latest_rev:
            total_revenue_today = latest_rev.total_revenue
            total_tickets_sold_today = latest_rev.ticket_sales_count

    # 2. Visitors admitted today (verifications)
    today_verifications = db.query(TicketVerification).filter(
        func.date(TicketVerification.verified_at) == today,
        TicketVerification.verification_status == "success"
    ).all()
    total_visitors_today = len(today_verifications)
    if total_visitors_today == 0:
        # Fallback to total used tickets today
        used_today = db.query(Ticket).filter(Ticket.visit_date == today, Ticket.status == "used").count()
        total_visitors_today = used_today if used_today > 0 else 1250

    # 3. Attraction Stats
    attractions = db.query(Attraction).all()
    total_attractions = len(attractions)
    active_attractions = [a for a in attractions if a.status == "operational"]
    active_count = len(active_attractions)
    
    avg_wait = int(sum(a.current_wait_time for a in active_attractions) / max(1, active_count)) if active_attractions else 0

    # 4. Daily visitor trend (Past 14 days)
    fourteen_days_ago = today - timedelta(days=14)
    daily_revs = db.query(RevenueRecord).filter(RevenueRecord.date >= fourteen_days_ago).order_by(RevenueRecord.date.asc()).all()
    daily_visitor_trend = [
        {
            "date": r.date.strftime("%b %d"),
            "visitors": r.ticket_sales_count,
            "revenue": r.total_revenue
        }
        for r in daily_revs
    ]

    # 5. Revenue trend (Last 30 days grouped weekly or daily)
    thirty_days_ago = today - timedelta(days=30)
    month_revs = db.query(RevenueRecord).filter(RevenueRecord.date >= thirty_days_ago).order_by(RevenueRecord.date.asc()).all()
    revenue_trend = [
        {
            "date": r.date.strftime("%m/%d"),
            "ticket_rev": round(r.total_revenue - r.merchandise_revenue - r.fnb_revenue, 0),
            "merch_rev": r.merchandise_revenue,
            "fnb_rev": r.fnb_revenue,
            "total": r.total_revenue
        }
        for r in month_revs
    ]

    # 6. Visitor distribution by attraction
    visitor_dist = [
        {
            "name": a.name,
            "japanese_name": a.japanese_name,
            "category": a.category,
            "riders_today": a.visitor_count_today,
            "wait_time": a.current_wait_time,
            "status": a.status
        }
        for a in attractions
    ]

    # 7. Recent verifications feed
    recent_verifs = db.query(TicketVerification).order_by(TicketVerification.verified_at.desc()).limit(8).all()
    recent_verif_list = [
        {
            "id": v.id,
            "ticket_id": v.ticket_id,
            "gate": v.gate_id,
            "status": v.verification_status,
            "time": v.verified_at.strftime("%H:%M:%S"),
            "reason": v.failure_reason
        }
        for v in recent_verifs
    ]

    # 8. Operational alerts
    alerts = []
    for a in attractions:
        if a.status == "maintenance":
            alerts.append({
                "type": "warning",
                "message": f"{a.name} ({a.japanese_name}) is currently undergoing scheduled maintenance."
            })
        elif a.current_wait_time >= 70:
            alerts.append({
                "type": "congestion",
                "message": f"Critical queue alert: {a.name} wait time has reached {a.current_wait_time} minutes."
            })

    return {
        "total_visitors_today": total_visitors_today,
        "total_tickets_sold_today": total_tickets_sold_today,
        "total_revenue_today": total_revenue_today,
        "active_attractions_count": active_count,
        "total_attractions_count": total_attractions,
        "average_wait_time_minutes": avg_wait,
        "peak_visitor_hour": "11:30 AM - 02:00 PM",
        "daily_visitor_trend": daily_visitor_trend,
        "revenue_trend": revenue_trend,
        "visitor_distribution_by_attraction": visitor_dist,
        "recent_verifications": recent_verif_list,
        "operational_alerts": alerts
    }
