import os
import csv
import io
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
import openpyxl
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from app.database import get_db
from app.models import Report, Ticket, Attraction, RevenueRecord, User
from app.schemas import ReportCreateRequest, ReportOut
from app.auth import get_current_user, require_admin, log_audit

router = APIRouter(prefix="/reports", tags=["Automated Reports"])

EXPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "exports")
os.makedirs(EXPORTS_DIR, exist_ok=True)

@router.get("", response_model=List[ReportOut])
def list_reports(db: Session = Depends(get_db)):
    return db.query(Report).order_by(Report.id.desc()).all()

@router.post("/generate", response_model=ReportOut)
def generate_report(
    req: ReportCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    title = f"Fuji-Q Highland - {req.report_type.replace('_', ' ').title()} ({timestamp_str})"
    filename = f"{req.report_type}_{timestamp_str}.{req.file_format}"
    file_path = os.path.join(EXPORTS_DIR, filename)

    # 1. Fetch relevant data
    today = datetime.utcnow().date()
    attractions = db.query(Attraction).all()
    recent_tickets = db.query(Ticket).order_by(Ticket.id.desc()).limit(100).all()
    recent_rev = db.query(RevenueRecord).order_by(RevenueRecord.date.desc()).limit(30).all()

    # 2. Build file based on format
    if req.file_format == "csv":
        with open(file_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            if req.report_type == "daily_ops":
                writer.writerow(["Fuji-Q Highland - Daily Operations Report", f"Generated: {datetime.utcnow().isoformat()}"])
                writer.writerow([])
                writer.writerow(["Attraction ID", "Name", "Japanese Name", "Status", "Wait Time (min)", "Riders Today", "Hourly Capacity"])
                for a in attractions:
                    writer.writerow([a.id, a.name, a.japanese_name, a.status, a.current_wait_time, a.visitor_count_today, a.hourly_capacity])
            elif req.report_type == "weekly_visitors":
                writer.writerow(["Fuji-Q Highland - Weekly Visitor Activity Report"])
                writer.writerow([])
                writer.writerow(["Ticket Ref", "Visitor ID", "Type", "Price (JPY)", "Visit Date", "Status"])
                for t in recent_tickets:
                    writer.writerow([t.booking_ref, t.visitor_id, t.ticket_type, t.price, t.visit_date, t.status])
            else: # monthly_revenue
                writer.writerow(["Fuji-Q Highland - Revenue Audit Report"])
                writer.writerow([])
                writer.writerow(["Date", "Total Revenue (JPY)", "Tickets Sold", "Merchandise", "F&B", "Notes"])
                for r in recent_rev:
                    writer.writerow([r.date, r.total_revenue, r.ticket_sales_count, r.merchandise_revenue, r.fnb_revenue, r.notes])

    elif req.file_format == "xlsx":
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Report Data"

        if req.report_type == "daily_ops":
            ws.append(["Fuji-Q Highland - Daily Operations Summary"])
            ws.append(["Report Generated", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")])
            ws.append([])
            ws.append(["Attraction Name", "Japanese Name", "Category", "Status", "Wait Time (min)", "Riders Today", "Capacity/Hour"])
            for a in attractions:
                ws.append([a.name, a.japanese_name, a.category, a.status, a.current_wait_time, a.visitor_count_today, a.hourly_capacity])
        elif req.report_type == "weekly_visitors":
            ws.append(["Fuji-Q Highland - Visitor Admissions & Ticket Log"])
            ws.append(["Report Generated", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")])
            ws.append([])
            ws.append(["Booking Ref", "Ticket Type", "Price (JPY)", "Visit Date", "Status"])
            for t in recent_tickets:
                ws.append([t.booking_ref, t.ticket_type, t.price, str(t.visit_date), t.status])
        else: # monthly_revenue
            ws.append(["Fuji-Q Highland - Financial Revenue Analysis"])
            ws.append(["Report Generated", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")])
            ws.append([])
            ws.append(["Date", "Total Revenue (JPY)", "Ticket Count", "Merch (JPY)", "F&B (JPY)", "Remarks"])
            for r in recent_rev:
                ws.append([str(r.date), r.total_revenue, r.ticket_sales_count, r.merchandise_revenue, r.fnb_revenue, r.notes])
        
        wb.save(file_path)

    elif req.file_format == "pdf":
        doc = SimpleDocTemplate(file_path, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor("#1e1e2d"),
            spaceAfter=12
        )
        sub_style = ParagraphStyle(
            'ReportSub',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor("#64748b"),
            spaceAfter=15
        )

        elements.append(Paragraph("FUJI-Q HIGHLAND – SMARTPARK AI PLATFORM", title_style))
        elements.append(Paragraph(f"Official Operations Document: {title}", sub_style))
        elements.append(Paragraph(f"Generated by: {current_user.full_name} | Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}", sub_style))
        elements.append(Spacer(1, 10))

        if req.report_type == "daily_ops":
            data = [["Attraction", "Status", "Wait (min)", "Riders Today", "Capacity/hr"]]
            for a in attractions:
                data.append([a.name, a.status.upper(), f"{a.current_wait_time} min", str(a.visitor_count_today), str(a.hourly_capacity)])
        elif req.report_type == "weekly_visitors":
            data = [["Booking Ref", "Type", "Price", "Date", "Status"]]
            for t in recent_tickets[:15]:
                data.append([t.booking_ref, t.ticket_type, f"¥{t.price:,.0f}", str(t.visit_date), t.status.upper()])
        else:
            data = [["Date", "Total Rev (JPY)", "Tickets Sold", "Merchandise", "F&B"]]
            for r in recent_rev[:15]:
                data.append([str(r.date), f"¥{r.total_revenue:,.0f}", str(r.ticket_sales_count), f"¥{r.merchandise_revenue:,.0f}", f"¥{r.fnb_revenue:,.0f}"])

        t = Table(data, hAlign='LEFT')
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e1e2d")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('TOPPADDING', (0, 1), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ]))
        elements.append(t)
        doc.build(elements)

    # Save to database
    report_record = Report(
        title=title,
        report_type=req.report_type,
        generated_by_user_id=current_user.id,
        file_format=req.file_format,
        file_path=file_path,
        summary_data=f"Exported {req.report_type} in {req.file_format.upper()} format.",
        created_at=datetime.utcnow()
    )
    db.add(report_record)
    db.commit()
    db.refresh(report_record)

    log_audit(db, current_user, "REPORT_GENERATED", "Report", f"Generated {req.report_type} in {req.file_format} format.")
    return report_record

@router.get("/{report_id}/download")
def download_report(report_id: int, db: Session = Depends(get_db)):
    rep = db.query(Report).filter(Report.id == report_id).first()
    if not rep or not os.path.exists(rep.file_path):
        raise HTTPException(status_code=404, detail="Report file not found")
    
    media_types = {
        "csv": "text/csv",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "pdf": "application/pdf"
    }
    filename = os.path.basename(rep.file_path)
    return FileResponse(
        rep.file_path,
        media_type=media_types.get(rep.file_format, "application/octet-stream"),
        filename=filename
    )
