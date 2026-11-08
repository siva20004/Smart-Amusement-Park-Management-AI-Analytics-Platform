from datetime import datetime, date
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# ----------------- Auth & User Schemas -----------------
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    role: str = Field(default="staff", pattern="^(admin|staff)$")

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None

# ----------------- Visitor Schemas -----------------
class VisitorBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    age_group: str = "Adult"
    nationality: str = "Japan"
    is_repeat_visitor: bool = False

class VisitorCreate(VisitorBase):
    pass

class VisitorOut(VisitorBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Ticket Schemas -----------------
class TicketCreate(BaseModel):
    visitor_name: str
    visitor_email: EmailStr
    visitor_phone: Optional[str] = None
    ticket_type: str = Field(..., pattern="^(Adult|Child|Family|Group|VIP)$")
    visit_date: date
    price: Optional[float] = None

class TicketOut(BaseModel):
    id: int
    booking_ref: str
    visitor_id: int
    visitor_name: Optional[str] = None
    visitor_email: Optional[str] = None
    ticket_type: str
    price: float
    booking_date: date
    visit_date: date
    status: str
    qr_code_data: str
    created_at: datetime

    class Config:
        from_attributes = True

class TicketVerifyRequest(BaseModel):
    qr_code_or_booking_ref: str
    gate_id: str = "Main Entrance - Gate 1"

class TicketVerifyResponse(BaseModel):
    status: str  # "success", "rejected_duplicate", "rejected_invalid"
    message: str
    ticket: Optional[TicketOut] = None
    verification_time: datetime
    previous_verification_time: Optional[datetime] = None
    gate_id: str

# ----------------- Attraction Schemas -----------------
class AttractionBase(BaseModel):
    name: str
    japanese_name: str
    category: str
    min_height_cm: int = 110
    duration_seconds: int = 120
    hourly_capacity: int = 1000
    max_capacity: int = 120
    operating_hours: str = "09:00 - 18:00"
    description: Optional[str] = None

class AttractionCreate(AttractionBase):
    status: str = "operational"

class AttractionUpdate(BaseModel):
    name: Optional[str] = None
    japanese_name: Optional[str] = None
    category: Optional[str] = None
    min_height_cm: Optional[int] = None
    duration_seconds: Optional[int] = None
    hourly_capacity: Optional[int] = None
    max_capacity: Optional[int] = None
    status: Optional[str] = None
    current_wait_time: Optional[int] = None
    visitor_count_today: Optional[int] = None
    operating_hours: Optional[str] = None
    description: Optional[str] = None

class AttractionOut(AttractionBase):
    id: int
    status: str
    current_wait_time: int
    visitor_count_today: int
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- AI Prediction Schemas -----------------
class WaitTimePredictRequest(BaseModel):
    attraction_id: int
    hour_of_day: int = Field(..., ge=0, le=23)
    day_of_week: int = Field(..., ge=0, le=6)  # 0=Monday, 6=Sunday
    is_weekend: bool = False
    is_holiday: bool = False
    weather: str = "Sunny"
    estimated_crowd_factor: float = Field(default=1.0, ge=0.2, le=3.0)

class WaitTimePredictResponse(BaseModel):
    attraction_id: int
    attraction_name: str
    japanese_name: str
    predicted_wait_time_minutes: int
    congestion_level: str  # "Low", "Moderate", "High", "Critical"
    recommended_visiting_window: str
    confidence_interval: List[int]
    factors: Dict[str, Any]

class DemandForecastItem(BaseModel):
    date: date
    day_name: str
    predicted_visitors: int
    confidence_lower: int
    confidence_upper: int
    expected_revenue_jpy: float
    is_weekend: bool
    is_holiday: bool
    recommended_staffing_level: int

class DemandForecastResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    next_day_forecast: DemandForecastItem
    seven_day_forecast: List[DemandForecastItem]
    model_metrics: Dict[str, Any]
    seasonality_summary: str
    limitations_and_disclaimer: str

# ----------------- Recommendation Schemas -----------------
class RecommendationItem(BaseModel):
    id: str
    category: str  # "Operations", "Staffing", "Crowd Control", "Revenue", "Maintenance"
    urgency: str   # "critical", "high", "medium", "low"
    title: str
    description: str
    impact: str
    recommended_action: str
    created_at: datetime

# ----------------- Dashboard & Analytics Schemas -----------------
class DashboardSummary(BaseModel):
    total_visitors_today: int
    total_tickets_sold_today: int
    total_revenue_today: float
    active_attractions_count: int
    total_attractions_count: int
    average_wait_time_minutes: int
    peak_visitor_hour: str
    daily_visitor_trend: List[Dict[str, Any]]
    revenue_trend: List[Dict[str, Any]]
    visitor_distribution_by_attraction: List[Dict[str, Any]]
    recent_verifications: List[Dict[str, Any]]
    operational_alerts: List[Dict[str, Any]]

class VisitorAnalyticsResponse(BaseModel):
    daily_trends: List[Dict[str, Any]]
    hourly_distribution: List[Dict[str, Any]]
    ticket_category_breakdown: List[Dict[str, Any]]
    repeat_visitor_rate: float
    demographics_by_age: List[Dict[str, Any]]
    top_popular_attractions: List[Dict[str, Any]]

class RevenueAnalyticsResponse(BaseModel):
    total_revenue: float
    ticket_revenue: float
    fnb_revenue: float
    merchandise_revenue: float
    growth_rate_pct: float
    daily_revenue_breakdown: List[Dict[str, Any]]
    revenue_by_category: List[Dict[str, Any]]
    attraction_popularity_revenue: List[Dict[str, Any]]

# ----------------- Report Schemas -----------------
class ReportCreateRequest(BaseModel):
    report_type: str = Field(..., pattern="^(daily_ops|weekly_visitors|monthly_revenue)$")
    file_format: str = Field(..., pattern="^(csv|xlsx|pdf)$")

class ReportOut(BaseModel):
    id: int
    title: str
    report_type: str
    file_format: str
    file_path: str
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Audit Log Schemas -----------------
class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    action: str
    resource: str
    details: Optional[str] = None
    ip_address: str
    created_at: datetime

    class Config:
        from_attributes = True
