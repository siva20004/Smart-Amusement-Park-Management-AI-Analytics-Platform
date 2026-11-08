from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Attraction, User, WaitTimeRecord
from app.schemas import AttractionCreate, AttractionUpdate, AttractionOut
from app.auth import get_current_user, require_staff, require_admin, log_audit

router = APIRouter(prefix="/attractions", tags=["Attraction Management"])

@router.get("", response_model=List[AttractionOut])
def list_attractions(
    category: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Attraction)
    if category:
        query = query.filter(Attraction.category == category)
    if status_filter:
        query = query.filter(Attraction.status == status_filter)
    return query.order_by(Attraction.id.asc()).all()

@router.get("/{attraction_id}", response_model=AttractionOut)
def get_attraction(attraction_id: int, db: Session = Depends(get_db)):
    attr = db.query(Attraction).filter(Attraction.id == attraction_id).first()
    if not attr:
        raise HTTPException(status_code=404, detail="Attraction not found")
    return attr

@router.post("", response_model=AttractionOut)
def create_attraction(
    attr_in: AttractionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    attr = Attraction(
        name=attr_in.name,
        japanese_name=attr_in.japanese_name,
        category=attr_in.category,
        min_height_cm=attr_in.min_height_cm,
        duration_seconds=attr_in.duration_seconds,
        hourly_capacity=attr_in.hourly_capacity,
        max_capacity=attr_in.max_capacity,
        status=attr_in.status,
        current_wait_time=15,
        visitor_count_today=0,
        operating_hours=attr_in.operating_hours,
        description=attr_in.description,
        created_at=datetime.utcnow()
    )
    db.add(attr)
    db.commit()
    db.refresh(attr)
    
    log_audit(db, current_user, "ATTRACTION_CREATE", "Attraction", f"Created attraction {attr.name} ({attr.japanese_name})")
    return attr

@router.put("/{attraction_id}", response_model=AttractionOut)
def update_attraction(
    attraction_id: int,
    attr_in: AttractionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    attr = db.query(Attraction).filter(Attraction.id == attraction_id).first()
    if not attr:
        raise HTTPException(status_code=404, detail="Attraction not found")
    
    update_data = attr_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(attr, field, val)
    
    # If wait time was updated, create a wait time record
    if "current_wait_time" in update_data:
        w_rec = WaitTimeRecord(
            attraction_id=attr.id,
            recorded_at=datetime.utcnow(),
            wait_time_minutes=attr.current_wait_time,
            visitor_count=int(attr.current_wait_time * 15),
            queue_length=int(attr.current_wait_time * 12),
            weather="Sunny",
            is_weekend=(datetime.utcnow().weekday() >= 5),
            hour_of_day=datetime.utcnow().hour
        )
        db.add(w_rec)
        
    db.commit()
    db.refresh(attr)
    
    log_audit(db, current_user, "ATTRACTION_UPDATE", "Attraction", f"Updated attraction {attr.name} attributes: {list(update_data.keys())}")
    return attr

@router.patch("/{attraction_id}/status", response_model=AttractionOut)
def set_attraction_status(
    attraction_id: int,
    status: str = Query(..., pattern="^(operational|maintenance|temporarily_closed)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    attr = db.query(Attraction).filter(Attraction.id == attraction_id).first()
    if not attr:
        raise HTTPException(status_code=404, detail="Attraction not found")
    
    old_status = attr.status
    attr.status = status
    if status in ["maintenance", "temporarily_closed"]:
        attr.current_wait_time = 0
        
    db.commit()
    db.refresh(attr)
    
    log_audit(db, current_user, "ATTRACTION_STATUS_CHANGE", "Attraction", f"Changed {attr.name} status from {old_status} to {status}")
    return attr
