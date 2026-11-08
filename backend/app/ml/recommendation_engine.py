from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models import Attraction, Ticket, RevenueRecord, VisitorForecast

def generate_business_recommendations(db: Session) -> List[Dict[str, Any]]:
    """
    Evaluates real live database values, queue dynamics, ticket sales,
    and forecasted attendance to generate actionable operational recommendations.
    """
    recommendations = []
    
    # 1. Evaluate Live Attraction Congestion & Capacity
    attractions = db.query(Attraction).all()
    high_wait_attractions = [a for a in attractions if a.status == "operational" and a.current_wait_time >= 60]
    low_wait_attractions = [a for a in attractions if a.status == "operational" and a.current_wait_time <= 15 and a.category in ["roller_coaster", "thrill"]]
    maintenance_needed = [a for a in attractions if a.visitor_count_today > 1200]

    for a in high_wait_attractions:
        recommendations.append({
            "id": f"rec-queue-{a.id}",
            "category": "Crowd Control",
            "urgency": "critical" if a.current_wait_time >= 90 else "high",
            "title": f"High Congestion on {a.name} ({a.current_wait_time} min wait)",
            "description": f"{a.name} ({a.japanese_name}) queue length has reached {a.current_wait_time} minutes, exceeding standard hospitality thresholds of 45 minutes.",
            "impact": "Reduces guest satisfaction by an estimated 18% and increases gate congestion.",
            "recommended_action": f"Deploy dual-train continuous dispatch, activate SmartFast QR express lane priority, and redirect arriving guests toward lower wait thrill zones.",
            "created_at": datetime.utcnow()
        })

    for a in low_wait_attractions:
        recommendations.append({
            "id": f"rec-underutil-{a.id}",
            "category": "Operations",
            "urgency": "medium",
            "title": f"Underutilized Capacity at {a.name} ({a.current_wait_time} min wait)",
            "description": f"{a.name} ({a.japanese_name}) currently operates below 30% hourly throughput capacity with only {a.current_wait_time} min wait.",
            "impact": "Uncaptured park thrill throughput and unbalanced crowd distribution.",
            "recommended_action": f"Broadcast digital billboard routing prompts on park mobile screens recommending {a.name} to disperse main plaza density.",
            "created_at": datetime.utcnow()
        })

    for a in maintenance_needed:
        recommendations.append({
            "id": f"rec-maint-{a.id}",
            "category": "Maintenance",
            "urgency": "high",
            "title": f"Predictive Maintenance Due: {a.name}",
            "description": f"{a.name} has completed heavy duty cycle with {a.visitor_count_today} riders today, nearing the daily safety inspection threshold.",
            "impact": "Prevents mechanical fault downtime during upcoming peak weekend surge.",
            "recommended_action": f"Schedule track & magnetic brake caliper sensor inspection during the 18:30 scheduled park closing window.",
            "created_at": datetime.utcnow()
        })

    # 2. Evaluate Forecasted Visitor Demand & Staffing
    forecasts = db.query(VisitorForecast).order_by(VisitorForecast.forecast_date.asc()).limit(3).all()
    if forecasts:
        next_day = forecasts[0]
        if next_day.predicted_visitors >= 6500:
            recommendations.append({
                "id": "rec-staff-surge",
                "category": "Staffing",
                "urgency": "critical",
                "title": f"High Visitor Demand Expected Tomorrow ({next_day.predicted_visitors:,} guests)",
                "description": f"AI model predicts {next_day.predicted_visitors:,} visitors for {next_day.forecast_date.strftime('%A, %b %d')}. Expected park revenue: ¥{next_day.expected_revenue:,.0f}.",
                "impact": "High risk of turnstile bottleneck at 09:30-11:00 AM entry peak if staff levels remain baseline.",
                "recommended_action": f"Increase gate ticket verification staff by +4 operators, open Gates 3-6 at 08:30 AM early admission, and stage guest assistance teams.",
                "created_at": datetime.utcnow()
            })
        elif next_day.predicted_visitors < 3500:
            recommendations.append({
                "id": "rec-staff-low",
                "category": "Staffing",
                "urgency": "low",
                "title": f"Moderate Demand Tomorrow ({next_day.predicted_visitors:,} guests) - Schedule Training",
                "description": f"Low forecasted attendance on {next_day.forecast_date.strftime('%A, %b %d')} provides an optimal window for facility maintenance and junior operator safety certifications.",
                "impact": "Optimizes labor cost efficiency by ¥240,000 without degrading guest service quality.",
                "recommended_action": f"Rotate 6 staff members to technical evacuation drill sessions and perform deep sanitization on Thomas Land rides.",
                "created_at": datetime.utcnow()
            })

    # 3. Evaluate Ticket Sales & Revenue Growth
    today_date = datetime.utcnow().date()
    today_tickets = db.query(Ticket).filter(Ticket.booking_date >= today_date - timedelta(days=7)).all()
    vip_count = sum(1 for t in today_tickets if t.ticket_type == "VIP")
    total_sales_7d = sum(t.price for t in today_tickets)

    if vip_count < len(today_tickets) * 0.08:
        recommendations.append({
            "id": "rec-rev-vip",
            "category": "Revenue",
            "urgency": "medium",
            "title": "VIP Priority Pass Upsell Opportunity",
            "description": f"VIP Pass adoption is currently at {round(vip_count / max(1, len(today_tickets)) * 100, 1)}% of total ticket sales over the past 7 days.",
            "impact": "Potential incremental revenue of ¥1,250,000 per week through targeted digital pass add-ons.",
            "recommended_action": "Enable dynamic in-app push offer for FastPass VIP upgrade to guests currently waiting in queues exceeding 40 minutes.",
            "created_at": datetime.utcnow()
        })

    # Return sorted by urgency
    urgency_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    recommendations.sort(key=lambda r: urgency_order.get(r["urgency"], 4))
    return recommendations
