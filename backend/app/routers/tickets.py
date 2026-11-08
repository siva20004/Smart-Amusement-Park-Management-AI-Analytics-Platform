import io
import base64
import random
from datetime import datetime, date
from typing import List, Optional
import qrcode
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import Ticket, Visitor, TicketVerification, User
from app.schemas import (
    TicketCreate, TicketOut, TicketVerifyRequest, TicketVerifyResponse
)
from app.auth import get_current_user, require_staff, log_audit

router = APIRouter(prefix="/tickets", tags=["Digital Ticketing"])

TICKET_PRICES = {
    "Adult": 7500.0,
    "Child": 4500.0,
    "Family": 18000.0,
    "Group": 24000.0,
    "VIP": 14000.0
}

def generate_qr_base64(data: str) -> str:
    """Generates a QR code image encoded as Base64 data URI."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1e1e2d", back_color="#ffffff")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64_str}"

@router.get("", response_model=List[TicketOut])
def list_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status_filter: Optional[str] = None,
    ticket_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Ticket).join(Visitor)
    
    if status_filter:
        query = query.filter(Ticket.status == status_filter)
    if ticket_type:
        query = query.filter(Ticket.ticket_type == ticket_type)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Ticket.booking_ref.ilike(search_fmt),
                Visitor.full_name.ilike(search_fmt),
                Visitor.email.ilike(search_fmt)
            )
        )
    
    tickets = query.order_by(Ticket.id.desc()).offset(skip).limit(limit).all()
    
    # Enrich with visitor info
    results = []
    for t in tickets:
        t_out = TicketOut(
            id=t.id,
            booking_ref=t.booking_ref,
            visitor_id=t.visitor_id,
            visitor_name=t.visitor.full_name if t.visitor else None,
            visitor_email=t.visitor.email if t.visitor else None,
            ticket_type=t.ticket_type,
            price=t.price,
            booking_date=t.booking_date,
            visit_date=t.visit_date,
            status=t.status,
            qr_code_data=t.qr_code_data,
            created_at=t.created_at
        )
        results.append(t_out)
    return results

@router.post("", response_model=TicketOut)
def create_ticket(
    ticket_in: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    # Find or create visitor
    visitor = db.query(Visitor).filter(Visitor.email == ticket_in.visitor_email).first()
    if not visitor:
        visitor = Visitor(
            full_name=ticket_in.visitor_name,
            email=ticket_in.visitor_email,
            phone=ticket_in.visitor_phone,
            age_group="Adult" if ticket_in.ticket_type != "Child" else "Child",
            nationality="Japan"
        )
        db.add(visitor)
        db.commit()
        db.refresh(visitor)
    
    # Unique booking reference
    random_code = random.randint(100000, 999999)
    booking_ref = f"FQ-2026-{random_code}"
    price = ticket_in.price if ticket_in.price is not None else TICKET_PRICES.get(ticket_in.ticket_type, 7500.0)
    
    qr_payload = f"SMARTPARK-FUJIQ:{booking_ref}:{visitor.id}:{ticket_in.visit_date.isoformat()}:{ticket_in.ticket_type}"
    qr_b64 = generate_qr_base64(qr_payload)
    
    ticket = Ticket(
        booking_ref=booking_ref,
        visitor_id=visitor.id,
        ticket_type=ticket_in.ticket_type,
        price=price,
        booking_date=datetime.utcnow().date(),
        visit_date=ticket_in.visit_date,
        status="valid",
        qr_code_data=qr_b64,
        created_at=datetime.utcnow()
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    
    log_audit(db, current_user, "TICKET_CREATED", "Ticket", f"Created ticket {booking_ref} for {visitor.full_name}")
    
    return TicketOut(
        id=ticket.id,
        booking_ref=ticket.booking_ref,
        visitor_id=ticket.visitor_id,
        visitor_name=visitor.full_name,
        visitor_email=visitor.email,
        ticket_type=ticket.ticket_type,
        price=ticket.price,
        booking_date=ticket.booking_date,
        visit_date=ticket.visit_date,
        status=ticket.status,
        qr_code_data=ticket.qr_code_data,
        created_at=ticket.created_at
    )

@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    t = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return TicketOut(
        id=t.id,
        booking_ref=t.booking_ref,
        visitor_id=t.visitor_id,
        visitor_name=t.visitor.full_name if t.visitor else None,
        visitor_email=t.visitor.email if t.visitor else None,
        ticket_type=t.ticket_type,
        price=t.price,
        booking_date=t.booking_date,
        visit_date=t.visit_date,
        status=t.status,
        qr_code_data=t.qr_code_data,
        created_at=t.created_at
    )

@router.post("/verify", response_model=TicketVerifyResponse)
def verify_ticket(
    verify_in: TicketVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Verifies ticket presentation at turnstile / gate.
    PREVENTS DUPLICATE USAGE:
    - If status == 'used', rejection status 'rejected_duplicate' is returned with previous admission time.
    - If status == 'cancelled' or 'refunded', rejection status 'rejected_invalid' is returned.
    - If valid, updates status to 'used', logs success verification, and returns gate pass approval.
    """
    query_str = verify_in.qr_code_or_booking_ref.strip()
    
    # Parse payload if it comes from raw QR string e.g. "SMARTPARK-FUJIQ:FQ-2026-10023:..."
    booking_ref = query_str
    if query_str.startswith("SMARTPARK-FUJIQ:"):
        parts = query_str.split(":")
        if len(parts) >= 2:
            booking_ref = parts[1]

    ticket = db.query(Ticket).filter(
        or_(
            Ticket.booking_ref == booking_ref,
            Ticket.qr_code_data == query_str
        )
    ).first()

    now = datetime.utcnow()

    # 1. Ticket Not Found
    if not ticket:
        return TicketVerifyResponse(
            status="rejected_invalid",
            message=f"Invalid QR code or booking reference '{booking_ref}'. Ticket record not found in system.",
            ticket=None,
            verification_time=now,
            previous_verification_time=None,
            gate_id=verify_in.gate_id
        )

    # 2. Check Duplicate Usage (Already Used)
    if ticket.status == "used":
        prev_verif = db.query(TicketVerification).filter(
            TicketVerification.ticket_id == ticket.id,
            TicketVerification.verification_status == "success"
        ).order_by(TicketVerification.verified_at.asc()).first()
        
        prev_time = prev_verif.verified_at if prev_verif else ticket.created_at
        
        # Log duplicate presentation attempt for security auditing
        dup_log = TicketVerification(
            ticket_id=ticket.id,
            verified_at=now,
            verified_by_user_id=current_user.id,
            gate_id=verify_in.gate_id,
            verification_status="rejected_duplicate",
            failure_reason=f"Duplicate entry attempt. Already admitted at {prev_time.strftime('%Y-%m-%d %H:%M:%S')} via {prev_verif.gate_id if prev_verif else 'Gate'}."
        )
        db.add(dup_log)
        db.commit()
        
        log_audit(db, current_user, "DUPLICATE_TICKET_REJECTED", "Turnstile", f"Rejected duplicate ticket {ticket.booking_ref} at {verify_in.gate_id}")

        t_out = TicketOut(
            id=ticket.id,
            booking_ref=ticket.booking_ref,
            visitor_id=ticket.visitor_id,
            visitor_name=ticket.visitor.full_name if ticket.visitor else None,
            visitor_email=ticket.visitor.email if ticket.visitor else None,
            ticket_type=ticket.ticket_type,
            price=ticket.price,
            booking_date=ticket.booking_date,
            visit_date=ticket.visit_date,
            status=ticket.status,
            qr_code_data=ticket.qr_code_data,
            created_at=ticket.created_at
        )

        return TicketVerifyResponse(
            status="rejected_duplicate",
            message=f"DUPLICATE PRESENTATION: Ticket {ticket.booking_ref} was already admitted at {prev_time.strftime('%H:%M:%S')} on {prev_time.strftime('%Y-%m-%d')}!",
            ticket=t_out,
            verification_time=now,
            previous_verification_time=prev_time,
            gate_id=verify_in.gate_id
        )

    # 3. Check Cancelled / Refunded
    if ticket.status in ["cancelled", "refunded"]:
        rej_log = TicketVerification(
            ticket_id=ticket.id,
            verified_at=now,
            verified_by_user_id=current_user.id,
            gate_id=verify_in.gate_id,
            verification_status="rejected_invalid",
            failure_reason=f"Ticket has been {ticket.status}."
        )
        db.add(rej_log)
        db.commit()
        
        t_out = TicketOut(
            id=ticket.id,
            booking_ref=ticket.booking_ref,
            visitor_id=ticket.visitor_id,
            visitor_name=ticket.visitor.full_name if ticket.visitor else None,
            visitor_email=ticket.visitor.email if ticket.visitor else None,
            ticket_type=ticket.ticket_type,
            price=ticket.price,
            booking_date=ticket.booking_date,
            visit_date=ticket.visit_date,
            status=ticket.status,
            qr_code_data=ticket.qr_code_data,
            created_at=ticket.created_at
        )

        return TicketVerifyResponse(
            status="rejected_invalid",
            message=f"ADMISSION DENIED: Ticket {ticket.booking_ref} is {ticket.status.upper()}.",
            ticket=t_out,
            verification_time=now,
            previous_verification_time=None,
            gate_id=verify_in.gate_id
        )

    # 4. Valid Ticket -> Grant Entry
    ticket.status = "used"
    success_log = TicketVerification(
        ticket_id=ticket.id,
        verified_at=now,
        verified_by_user_id=current_user.id,
        gate_id=verify_in.gate_id,
        verification_status="success",
        failure_reason=None
    )
    db.add(success_log)
    db.commit()
    db.refresh(ticket)

    log_audit(db, current_user, "TICKET_VERIFIED_SUCCESS", "Turnstile", f"Admitted ticket {ticket.booking_ref} at {verify_in.gate_id}")

    t_out = TicketOut(
        id=ticket.id,
        booking_ref=ticket.booking_ref,
        visitor_id=ticket.visitor_id,
        visitor_name=ticket.visitor.full_name if ticket.visitor else None,
        visitor_email=ticket.visitor.email if ticket.visitor else None,
        ticket_type=ticket.ticket_type,
        price=ticket.price,
        booking_date=ticket.booking_date,
        visit_date=ticket.visit_date,
        status=ticket.status,
        qr_code_data=ticket.qr_code_data,
        created_at=ticket.created_at
    )

    return TicketVerifyResponse(
        status="success",
        message=f"ADMISSION GRANTED: Welcome to Fuji-Q Highland! Pass Type: {ticket.ticket_type} ({ticket.visitor.full_name if ticket.visitor else 'Guest'}).",
        ticket=t_out,
        verification_time=now,
        previous_verification_time=None,
        gate_id=verify_in.gate_id
    )

@router.patch("/{ticket_id}/status", response_model=TicketOut)
def update_ticket_status(
    ticket_id: int,
    new_status: str = Query(..., pattern="^(valid|used|cancelled|refunded)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    old_status = ticket.status
    ticket.status = new_status
    db.commit()
    db.refresh(ticket)
    
    log_audit(db, current_user, "TICKET_STATUS_UPDATE", "Ticket", f"Updated ticket {ticket.booking_ref} status from {old_status} to {new_status}")
    
    return TicketOut(
        id=ticket.id,
        booking_ref=ticket.booking_ref,
        visitor_id=ticket.visitor_id,
        visitor_name=ticket.visitor.full_name if ticket.visitor else None,
        visitor_email=ticket.visitor.email if ticket.visitor else None,
        ticket_type=ticket.ticket_type,
        price=ticket.price,
        booking_date=ticket.booking_date,
        visit_date=ticket.visit_date,
        status=ticket.status,
        qr_code_data=ticket.qr_code_data,
        created_at=ticket.created_at
    )
