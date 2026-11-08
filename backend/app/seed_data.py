import os
import random
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import (
    User, Visitor, Ticket, TicketVerification, Attraction,
    AttractionVisit, WaitTimeRecord, RevenueRecord, VisitorForecast,
    Report, AuditLog
)
from app.auth import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        existing_users = db.query(User).first()
        if existing_users:
            print("[Seed Data] Database already seeded. Skipping full regeneration.")
            return

        print("[Seed Data] Starting realistic Fuji-Q Highland demonstration data generation...")

        # 1. Create Default Users (Admin and Staff)
        admin_user = User(
            email="admin@fujiq.jp",
            hashed_password=get_password_hash("Admin@FujiQ2026!"),
            full_name="Kenjiro Sato (佐藤 健二郎)",
            role="admin",
            is_active=True,
            created_at=datetime.utcnow() - timedelta(days=90)
        )
        staff_user = User(
            email="staff@fujiq.jp",
            hashed_password=get_password_hash("Staff@FujiQ2026!"),
            full_name="Aoi Takahashi (高橋 葵)",
            role="staff",
            is_active=True,
            created_at=datetime.utcnow() - timedelta(days=90)
        )
        db.add_all([admin_user, staff_user])
        db.commit()
        db.refresh(admin_user)
        db.refresh(staff_user)

        # 2. Create 10 Attractions inspired by Fuji-Q Highland
        attractions_meta = [
            {
                "name": "FUJIYAMA",
                "japanese_name": "FUJIYAMA (キング・オブ・コースター)",
                "category": "roller_coaster",
                "min_height_cm": 120,
                "duration_seconds": 216,
                "hourly_capacity": 1200,
                "max_capacity": 140,
                "status": "operational",
                "current_wait_time": 65,
                "visitor_count_today": 1150,
                "operating_hours": "09:00 - 18:00",
                "description": "The legendary King of Coasters with a 79m peak overlooking Mount Fuji and a 130 km/h top speed."
            },
            {
                "name": "Eejanaika",
                "japanese_name": "ええじゃないか (4Dハイパーコースター)",
                "category": "roller_coaster",
                "min_height_cm": 125,
                "duration_seconds": 130,
                "hourly_capacity": 1000,
                "max_capacity": 120,
                "status": "operational",
                "current_wait_time": 75,
                "visitor_count_today": 980,
                "operating_hours": "09:00 - 18:00",
                "description": "World-record 4th Dimension hypercoaster featuring 14 total inversions with spinning seats."
            },
            {
                "name": "Takabisha",
                "japanese_name": "高飛車 (最恐121度落下)",
                "category": "roller_coaster",
                "min_height_cm": 130,
                "duration_seconds": 112,
                "hourly_capacity": 850,
                "max_capacity": 100,
                "status": "operational",
                "current_wait_time": 50,
                "visitor_count_today": 840,
                "operating_hours": "09:00 - 18:00",
                "description": "Steepest roller coaster drop in the world at 121 degrees after linear induction launch."
            },
            {
                "name": "ZOKKON",
                "japanese_name": "ZOKKON (バイク型急加速コースター)",
                "category": "roller_coaster",
                "min_height_cm": 120,
                "duration_seconds": 180,
                "hourly_capacity": 950,
                "max_capacity": 110,
                "status": "operational",
                "current_wait_time": 45,
                "visitor_count_today": 910,
                "operating_hours": "09:00 - 18:00",
                "description": "Next-generation motorbike coaster equipped with LED sound stages and reverse acceleration."
            },
            {
                "name": "Super Scary Labyrinth of Fear",
                "japanese_name": "戦慄迷宮 (慈急総合病院 廃墟病棟)",
                "category": "horror",
                "min_height_cm": 110,
                "duration_seconds": 3000,
                "hourly_capacity": 600,
                "max_capacity": 90,
                "status": "operational",
                "current_wait_time": 90,
                "visitor_count_today": 620,
                "operating_hours": "10:00 - 17:30",
                "description": "The world's longest walk-through haunted house measuring 900m across a decrepit hospital ward."
            },
            {
                "name": "Do-Dodonpa Plaza",
                "japanese_name": "ド・ドドンパ・メモリアルスリルゾーン",
                "category": "thrill",
                "min_height_cm": 130,
                "duration_seconds": 90,
                "hourly_capacity": 1100,
                "max_capacity": 80,
                "status": "maintenance",
                "current_wait_time": 0,
                "visitor_count_today": 0,
                "operating_hours": "Scheduled Maintenance",
                "description": "Commemorative air-launch attraction plaza undergoing high-speed pneumatics upgrade."
            },
            {
                "name": "Tekkotsu Bancho",
                "japanese_name": "鉄骨番長 (大回転ブランコタワー)",
                "category": "thrill",
                "min_height_cm": 110,
                "duration_seconds": 180,
                "hourly_capacity": 750,
                "max_capacity": 80,
                "status": "operational",
                "current_wait_time": 25,
                "visitor_count_today": 710,
                "operating_hours": "09:00 - 18:00",
                "description": "Gigantic 59m tower swing rotating riders at 51 km/h with panoramic views of Mount Fuji."
            },
            {
                "name": "Panic Clock",
                "japanese_name": "パニック・クロック (時空逆転スイング)",
                "category": "thrill",
                "min_height_cm": 120,
                "duration_seconds": 150,
                "hourly_capacity": 700,
                "max_capacity": 60,
                "status": "operational",
                "current_wait_time": 15,
                "visitor_count_today": 530,
                "operating_hours": "09:00 - 18:00",
                "description": "Rotating pendulum arms simulating chaotic time manipulation with sudden gravity shifts."
            },
            {
                "name": "Nagashimasuka",
                "japanese_name": "ナガシマスカ (大水飛沫激流ラフト)",
                "category": "water",
                "min_height_cm": 110,
                "duration_seconds": 270,
                "hourly_capacity": 900,
                "max_capacity": 100,
                "status": "operational",
                "current_wait_time": 35,
                "visitor_count_today": 760,
                "operating_hours": "09:30 - 17:30",
                "description": "High-splash whitewater raft adventure winding beneath colossal golden beckoning cat statues."
            },
            {
                "name": "Thomas Land Express",
                "japanese_name": "トーマスランド (わくわくライド)",
                "category": "family",
                "min_height_cm": 90,
                "duration_seconds": 360,
                "hourly_capacity": 800,
                "max_capacity": 90,
                "status": "operational",
                "current_wait_time": 15,
                "visitor_count_today": 680,
                "operating_hours": "09:00 - 17:00",
                "description": "Whimsical family railway excursion through the Island of Sodor with interactive storytelling."
            }
        ]

        created_attractions = []
        for a_data in attractions_meta:
            attr = Attraction(**a_data)
            db.add(attr)
            created_attractions.append(attr)
        db.commit()
        for a in created_attractions:
            db.refresh(a)

        # 3. Create 5,000 Visitors
        print("[Seed Data] Generating 5,000 realistic visitor profiles...")
        first_names_jp = ["Hiroshi", "Yuki", "Kenji", "Sakura", "Daiki", "Mei", "Ren", "Yua", "Haruto", "Hina", "Sora", "Akari", "Kaito", "Nanami", "Shota"]
        last_names_jp = ["Tanaka", "Suzuki", "Sato", "Takahashi", "Watanabe", "Ito", "Yamamoto", "Nakamura", "Kobayashi", "Kato", "Yoshida", "Yamada"]
        first_names_intl = ["David", "Emma", "Lucas", "Sophie", "Michael", "Chloe", "Alexander", "Olivia", "James", "Mia"]
        last_names_intl = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Chen", "Kim", "Lee"]

        age_groups = ["Child", "Teen", "Adult", "Senior"]
        age_weights = [0.15, 0.25, 0.50, 0.10]
        nationalities = ["Japan", "Japan", "Japan", "Japan", "United States", "Taiwan", "South Korea", "Australia", "United Kingdom", "France"]

        visitors_to_add = []
        for i in range(1, 5001):
            is_intl = random.random() < 0.22
            if is_intl:
                fn = random.choice(first_names_intl)
                ln = random.choice(last_names_intl)
                nat = random.choice(["United States", "Taiwan", "South Korea", "Australia", "United Kingdom", "France"])
            else:
                fn = random.choice(first_names_jp)
                ln = random.choice(last_names_jp)
                nat = "Japan"

            full_name = f"{ln} {fn}"
            email = f"{fn.lower()}.{ln.lower()}{i}@example.com"
            phone = f"+81-{random.randint(70, 90)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"
            age_group = random.choices(age_groups, weights=age_weights)[0]
            is_repeat = random.random() < 0.28

            v = Visitor(
                full_name=full_name,
                email=email,
                phone=phone,
                age_group=age_group,
                nationality=nat,
                is_repeat_visitor=is_repeat,
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 90))
            )
            visitors_to_add.append(v)

        db.bulk_save_objects(visitors_to_add)
        db.commit()

        # Retrieve visitor IDs
        visitor_ids = [row[0] for row in db.query(Visitor.id).all()]

        # 4. Create 3 Months of Tickets
        print("[Seed Data] Generating 3 months of digital ticket bookings and verifications...")
        ticket_types = ["Adult", "Child", "Family", "Group", "VIP"]
        ticket_prices = {
            "Adult": 7500.0,
            "Child": 4500.0,
            "Family": 18000.0,
            "Group": 24000.0,
            "VIP": 14000.0
        }
        ticket_weights = [0.52, 0.18, 0.14, 0.08, 0.08]

        start_date = datetime.utcnow().date() - timedelta(days=89)
        end_date = datetime.utcnow().date()

        tickets_to_add = []
        ticket_index = 10001
        
        # Pre-generate 6,000 tickets across the 90 days
        for day_offset in range(90):
            current_date = start_date + timedelta(days=day_offset)
            is_weekend = current_date.weekday() >= 5
            # Higher ticket volume on weekends
            daily_count = random.randint(75, 120) if is_weekend else random.randint(40, 70)
            if day_offset == 89: # Today
                daily_count = 110

            for _ in range(daily_count):
                v_id = random.choice(visitor_ids)
                t_type = random.choices(ticket_types, weights=ticket_weights)[0]
                price = ticket_prices[t_type]
                booking_ref = f"FQ-2026-{ticket_index}"
                ticket_index += 1

                # Status distribution: Most past tickets used, today has valid + used, few cancelled
                if current_date < end_date:
                    rand_status = random.random()
                    status = "used" if rand_status < 0.93 else ("cancelled" if rand_status < 0.97 else "refunded")
                else:
                    status = random.choice(["valid", "used", "valid", "valid"])

                qr_payload = f"SMARTPARK-FUJIQ:{booking_ref}:{v_id}:{current_date.isoformat()}:{t_type}"

                t = Ticket(
                    booking_ref=booking_ref,
                    visitor_id=v_id,
                    ticket_type=t_type,
                    price=price,
                    booking_date=current_date - timedelta(days=random.randint(1, 14)),
                    visit_date=current_date,
                    status=status,
                    qr_code_data=qr_payload,
                    created_at=datetime.combine(current_date, datetime.min.time())
                )
                tickets_to_add.append(t)

        db.bulk_save_objects(tickets_to_add)
        db.commit()

        # 5. Create Ticket Verifications for "used" tickets & duplicate attempt records
        print("[Seed Data] Creating gate verifications and duplicate rejection records...")
        used_tickets = db.query(Ticket).filter(Ticket.status == "used").limit(3500).all()
        verifications_to_add = []
        gates = ["Main Entrance - Gate 1", "Main Entrance - Gate 2", "Highland Resort VIP Gate", "Fujikawaguchiko Gate 3"]

        for t in used_tickets:
            v_time = datetime.combine(t.visit_date, datetime.min.time()) + timedelta(hours=random.randint(9, 13), minutes=random.randint(0, 59))
            v_log = TicketVerification(
                ticket_id=t.id,
                verified_at=v_time,
                verified_by_user_id=staff_user.id,
                gate_id=random.choice(gates),
                verification_status="success",
                failure_reason=None
            )
            verifications_to_add.append(v_log)

            # Introduce a small number of realistic duplicate scan attempts to demonstrate duplicate rejection guard
            if random.random() < 0.02:
                dup_time = v_time + timedelta(minutes=random.randint(15, 120))
                dup_log = TicketVerification(
                    ticket_id=t.id,
                    verified_at=dup_time,
                    verified_by_user_id=staff_user.id,
                    gate_id="Main Entrance - Gate 2",
                    verification_status="rejected_duplicate",
                    failure_reason=f"Duplicate presentation. Ticket already admitted at {v_time.strftime('%H:%M:%S')}."
                )
                verifications_to_add.append(dup_log)

        db.bulk_save_objects(verifications_to_add)
        db.commit()

        # 6. Generate 90 Days of Hourly Waiting Time Records
        print("[Seed Data] Generating historical queue wait time logs for AI modeling...")
        wait_records_to_add = []
        for day_offset in range(90):
            rec_date = start_date + timedelta(days=day_offset)
            is_wk = rec_date.weekday() >= 5
            for hr in [9, 11, 13, 15, 17]:
                crowd_mult = 1.6 if (11 <= hr <= 15) else 1.0
                if is_wk:
                    crowd_mult *= 1.4
                for a in created_attractions:
                    base_wait = 30 if a.category == "roller_coaster" else 15
                    w_time = int(base_wait * crowd_mult + random.randint(-5, 15))
                    w_time = max(5, min(150, w_time))
                    q_len = int(w_time * (a.hourly_capacity / 60) * 0.8)

                    w_rec = WaitTimeRecord(
                        attraction_id=a.id,
                        recorded_at=datetime.combine(rec_date, datetime.min.time()) + timedelta(hours=hr),
                        wait_time_minutes=w_time,
                        visitor_count=int(q_len * 1.2),
                        queue_length=q_len,
                        weather=random.choice(["Sunny", "Sunny", "Cloudy", "Rainy"]),
                        is_holiday=False,
                        is_weekend=is_wk,
                        hour_of_day=hr
                    )
                    wait_records_to_add.append(w_rec)

        db.bulk_save_objects(wait_records_to_add)
        db.commit()

        # 7. Generate Daily Revenue Records across 90 days
        print("[Seed Data] Generating 90 days of revenue telemetry...")
        rev_records_to_add = []
        for day_offset in range(90):
            r_date = start_date + timedelta(days=day_offset)
            is_wk = r_date.weekday() >= 5
            # Query actual tickets on this day for realistic consistency
            day_tickets = db.query(Ticket).filter(Ticket.booking_date == r_date).all()
            ticket_rev = sum(t.price for t in day_tickets) if day_tickets else (4500000.0 if is_wk else 2800000.0)
            ticket_count = len(day_tickets) if day_tickets else (500 if is_wk else 300)

            # Merchandise (FUJIYAMA souvenirs, anime collabs) & F&B (Yamanashi Hoto noodles, churros)
            merch_rev = round(ticket_rev * random.uniform(0.25, 0.35), 2)
            fnb_rev = round(ticket_rev * random.uniform(0.20, 0.30), 2)
            total_rev = round(ticket_rev + merch_rev + fnb_rev, 2)

            rev_rec = RevenueRecord(
                date=r_date,
                total_revenue=total_rev,
                ticket_sales_count=ticket_count,
                merchandise_revenue=merch_rev,
                fnb_revenue=fnb_rev,
                notes="Peak weekend attendance" if is_wk else "Standard weekday operations",
                created_at=datetime.combine(r_date, datetime.min.time())
            )
            rev_records_to_add.append(rev_rec)

        db.bulk_save_objects(rev_records_to_add)
        db.commit()

        # 8. Generate 7-Day AI Visitor Forecasts
        print("[Seed Data] Seeding 7-day visitor demand forecasts...")
        today = datetime.utcnow().date()
        forecasts_to_add = []
        for i in range(1, 8):
            f_date = today + timedelta(days=i)
            is_wk = f_date.weekday() >= 5
            pred_v = random.randint(7200, 8900) if is_wk else random.randint(4400, 5600)
            conf_low = int(pred_v * 0.92)
            conf_up = int(pred_v * 1.08)
            exp_rev = round(pred_v * 8850.0, 2)

            fc = VisitorForecast(
                forecast_date=f_date,
                predicted_visitors=pred_v,
                confidence_lower=conf_low,
                confidence_upper=conf_up,
                expected_revenue=exp_rev,
                model_version="gb-demand-v2.1",
                created_at=datetime.utcnow()
            )
            forecasts_to_add.append(fc)

        db.bulk_save_objects(forecasts_to_add)
        db.commit()

        # 9. Audit Logs
        audit_1 = AuditLog(
            user_id=admin_user.id,
            action="SYSTEM_INIT",
            resource="Database",
            details="Fuji-Q Highland DX SmartPark platform initialization complete.",
            ip_address="127.0.0.1",
            created_at=datetime.utcnow() - timedelta(hours=2)
        )
        audit_2 = AuditLog(
            user_id=admin_user.id,
            action="ML_RETRAIN",
            resource="QueueModel",
            details="Trained Scikit-learn RandomForestRegressor queue wait model (R2=0.970).",
            ip_address="127.0.0.1",
            created_at=datetime.utcnow() - timedelta(hours=1)
        )
        db.add_all([audit_1, audit_2])
        db.commit()

        print("[Seed Data] Fuji-Q Highland demonstration dataset successfully created!")

    except Exception as e:
        db.rollback()
        print(f"[Seed Data Error] Failed to seed database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
