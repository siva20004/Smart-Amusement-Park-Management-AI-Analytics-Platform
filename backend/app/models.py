from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text, Index
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="staff")  # "admin" or "staff"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    verifications = relationship("TicketVerification", back_populates="verified_by_user")
    audit_logs = relationship("AuditLog", back_populates="user")
    reports = relationship("Report", back_populates="generated_by_user")


class Visitor(Base):
    __tablename__ = "visitors"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    age_group = Column(String(50), default="Adult")  # Child, Teen, Adult, Senior
    nationality = Column(String(100), default="Japan")
    is_repeat_visitor = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    tickets = relationship("Ticket", back_populates="visitor")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    booking_ref = Column(String(100), unique=True, index=True, nullable=False)
    visitor_id = Column(Integer, ForeignKey("visitors.id"), nullable=False, index=True)
    ticket_type = Column(String(50), nullable=False)  # Adult, Child, Family, Group, VIP
    price = Column(Float, nullable=False)
    booking_date = Column(Date, nullable=False, index=True)
    visit_date = Column(Date, nullable=False, index=True)
    status = Column(String(50), default="valid", nullable=False, index=True)  # valid, used, cancelled, refunded
    qr_code_data = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    visitor = relationship("Visitor", back_populates="tickets")
    verifications = relationship("TicketVerification", back_populates="ticket")
    attraction_visits = relationship("AttractionVisit", back_populates="ticket")


class TicketVerification(Base):
    __tablename__ = "ticket_verifications"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False, index=True)
    verified_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    verified_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    gate_id = Column(String(50), default="Main Entrance - Gate 1", nullable=False)
    verification_status = Column(String(50), nullable=False)  # success, rejected_duplicate, rejected_invalid
    failure_reason = Column(String(255), nullable=True)

    ticket = relationship("Ticket", back_populates="verifications")
    verified_by_user = relationship("User", back_populates="verifications")


class Attraction(Base):
    __tablename__ = "attractions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    japanese_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)  # roller_coaster, horror, family, water, thrill
    min_height_cm = Column(Integer, default=110)
    duration_seconds = Column(Integer, default=120)
    hourly_capacity = Column(Integer, default=1000)
    max_capacity = Column(Integer, default=120)  # queue holding capacity
    status = Column(String(50), default="operational", nullable=False, index=True)  # operational, maintenance, temporarily_closed
    current_wait_time = Column(Integer, default=15)  # minutes
    visitor_count_today = Column(Integer, default=0)
    operating_hours = Column(String(100), default="09:00 - 18:00")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    wait_time_records = relationship("WaitTimeRecord", back_populates="attraction")
    attraction_visits = relationship("AttractionVisit", back_populates="attraction")


class AttractionVisit(Base):
    __tablename__ = "attraction_visits"

    id = Column(Integer, primary_key=True, index=True)
    attraction_id = Column(Integer, ForeignKey("attractions.id"), nullable=False, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False, index=True)
    visit_time = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    wait_time_experienced = Column(Integer, default=20)

    attraction = relationship("Attraction", back_populates="attraction_visits")
    ticket = relationship("Ticket", back_populates="attraction_visits")


class WaitTimeRecord(Base):
    __tablename__ = "waiting_time_records"

    id = Column(Integer, primary_key=True, index=True)
    attraction_id = Column(Integer, ForeignKey("attractions.id"), nullable=False, index=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    wait_time_minutes = Column(Integer, nullable=False)
    visitor_count = Column(Integer, default=0)
    queue_length = Column(Integer, default=0)
    weather = Column(String(50), default="Sunny")
    is_holiday = Column(Boolean, default=False)
    is_weekend = Column(Boolean, default=False)
    hour_of_day = Column(Integer, nullable=False)

    attraction = relationship("Attraction", back_populates="wait_time_records")


class RevenueRecord(Base):
    __tablename__ = "revenue_records"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, index=True, nullable=False)
    total_revenue = Column(Float, nullable=False)
    ticket_sales_count = Column(Integer, default=0)
    merchandise_revenue = Column(Float, default=0.0)
    fnb_revenue = Column(Float, default=0.0)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class VisitorForecast(Base):
    __tablename__ = "visitor_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    forecast_date = Column(Date, nullable=False, index=True)
    predicted_visitors = Column(Integer, nullable=False)
    confidence_lower = Column(Integer, nullable=False)
    confidence_upper = Column(Integer, nullable=False)
    expected_revenue = Column(Float, nullable=False)
    model_version = Column(String(50), default="rf-v1.0")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    report_type = Column(String(50), nullable=False)  # daily_ops, weekly_visitors, monthly_revenue
    generated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    file_format = Column(String(20), nullable=False)  # csv, xlsx, pdf
    file_path = Column(String(500), nullable=False)
    summary_data = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    generated_by_user = relationship("User", back_populates="reports")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    resource = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="audit_logs")
