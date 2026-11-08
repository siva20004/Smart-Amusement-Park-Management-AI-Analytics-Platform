from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, AuditLog
from app.schemas import UserOut, AuditLogOut
from app.auth import get_current_user, require_admin, log_audit

router = APIRouter(prefix="/users", tags=["User Management"])

@router.get("", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    return db.query(User).order_by(User.id.asc()).all()

@router.patch("/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int,
    new_role: str = Query(..., pattern="^(admin|staff)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    old_role = target_user.role
    target_user.role = new_role
    db.commit()
    db.refresh(target_user)
    
    log_audit(db, current_user, "USER_ROLE_UPDATED", "User", f"Changed role for {target_user.email} from {old_role} to {new_role}")
    return target_user

@router.patch("/{user_id}/status", response_model=UserOut)
def toggle_user_active(
    user_id: int,
    active: bool = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    target_user.is_active = active
    db.commit()
    db.refresh(target_user)
    
    action = "USER_ACTIVATED" if active else "USER_DEACTIVATED"
    log_audit(db, current_user, action, "User", f"Set is_active={active} for user {target_user.email}")
    return target_user

@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    logs = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(limit).all()
    results = []
    for l in logs:
        results.append(AuditLogOut(
            id=l.id,
            user_id=l.user_id,
            user_name=l.user.full_name if l.user else "System",
            action=l.action,
            resource=l.resource,
            details=l.details,
            ip_address=l.ip_address,
            created_at=l.created_at
        ))
    return results
