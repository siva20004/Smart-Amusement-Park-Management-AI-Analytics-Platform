# SmartPark AI – Intelligent Amusement Park Management & AI Analytics Platform
### 富士急ハイランド デジタルトランスフォーメーション (Fuji-Q Highland DX Operations Twin)

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19%20%7C%20TypeScript-61DAFB.svg)](https://reactjs.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-AI%2FML-F7931E.svg)](https://scikit-learn.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL%20%2F%20Neon-Compatible-336791.svg)](https://neon.tech/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 1. Executive Summary & Business Problem

Amusement parks and destination resorts such as **Fuji-Q Highland** (operated by **Fuji Kyuko Co., Ltd.** in Yamanashi Prefecture, Japan) operate high-velocity, high-concurrency environments with extreme queue sensitivity. On peak weekends, major roller coasters such as *FUJIYAMA*, *Eejanaika*, and *Takabisha* can experience queue lengths exceeding 90–120 minutes. Turnstiles face heavy morning admission spikes (09:30–11:30 AM), and operations must coordinate ticketing yield, ride maintenance cycles, staffing levels, and commercial retail performance across fluctuating weather conditions around Mount Fuji.

**SmartPark AI** is a production-grade full-stack Digital Transformation (DX) operations platform engineered to solve these operational bottlenecks. Combining real-time turnstile telemetry, encrypted 2D digital passes, machine-learned queue wait estimation, 7-day demand forecasting, automated PDF/Excel executive reporting, and heuristic decision support, SmartPark AI bridges guest satisfaction with operational cost efficiency.

---

## 2. Core Architectural Features

### 🎛️ Module 1: Executive KPI Dashboard (統合運行ダッシュボード)
- Real-time aggregation of today's admissions, active ride throughput, and gross commercial yield directly from database records.
- 14-day rolling visitor attendance curves and multi-stream revenue compositions (Tickets, Souvenirs, Local F&B).
- Fleet-wide ride queue matrix tracking wait times against standard hospitality thresholds (45 min limit).

### 🎟️ Module 2: Digital Ticket & Turnstile Anti-Passback System (チケット発券・重複防止)
- Instant generation of unique booking passes (`FQ-2026-XXXXX`) encoded into dynamic Base64 QR code data URIs.
- Ticket categories: **Adult**, **Child**, **Family Pass**, **Group Pass**, and **VIP FastPass**.
- **Anti-Passback Duplicate Guard**: Turnstile scanner automatically flags re-presented tickets with `rejected_duplicate`, highlighting the previous admission timestamp and gate ID while recording the event in security audit logs.

### 🎢 Module 3: Attraction Fleet Operations (アトラクション運行管理)
- Live operational state controls for 10 iconic Fuji-Q attractions:
  1. **FUJIYAMA** (キング・オブ・コースター)
  2. **Eejanaika** (ええじゃないか - 4Dハイパーコースター)
  3. **Takabisha** (高飛車 - 最恐121度落下)
  4. **ZOKKON** (バイク型急加速コースター)
  5. **Super Scary Labyrinth of Fear** (戦慄迷宮 - 廃墟病棟)
  6. **Do-Dodonpa Memorial Plaza** (ド・ドドンパ)
  7. **Tekkotsu Bancho** (鉄骨番長)
  8. **Panic Clock** (パニック・クロック)
  9. **Nagashimasuka** (ナガシマスカ)
  10. **Thomas Land Express** (トーマスランド)
- Real-time capacity adjustments, wait-time sliders, and maintenance cycle toggles.

### ⏱️ Module 4: Scikit-learn AI Queue Wait Predictor (AI待ち時間予測)
- Multi-parameter `RandomForestRegressor` (100 estimators, max depth 12) calibrated on historical queue dynamics.
- Input features: Attraction hourly capacity, time of day (9:00–20:00), day of week, weekend surge flag, national holiday index, weather conditions (Sunny/Cloudy/Rainy), and park crowd density factor.
- Outputs predicted minutes, 95% confidence interval band, congestion rating, and recommended guest arrival windows ($R^2 = 0.970$, $\text{MAE} = 5.9\text{ min}$).

### 👥 Module 5: Visitor Demographics & Flow Analytics (来園者動態分析)
- 30-day attendance trends, diurnal turnstile influx distributions, and age cohort breakdowns.
- Repeat visitor loyalty tracking (28.4% return rate).

### 📈 Module 6: 7-Day AI Visitor Demand Forecasting (7日間来園需要予測)
- `GradientBoostingRegressor` model predicting 7-day attendance curves, weekend demand elasticity, expected revenue in Japanese Yen (JPY), and adaptive gate crew staffing levels ($R^2 = 0.977$, $\text{MAE} = 295\text{ visitors}$).
- Full disclosure of model assumptions and weather boundaries.

### 💴 Module 7: Commercial Revenue Analytics (売上収益インサイト)
- Financial telemetry across Ticket Sales, Souvenir/Anime merchandise, and local Yamanashi F&B.
- Ride revenue attribution matrix correlating guest throughput with commercial spending.

### 💡 Module 8: AI Business Recommendation Engine (AI業務意思決定支援)
- Heuristic and predictive rules evaluating live database conditions to deliver actionable operational directives.
- Urgency tiers (Critical, High, Medium, Low) with quantified business impact for staffing surges, queue diversion, and preventative track maintenance.

### 📑 Module 9: Automated Executive Reporting (帳票・レポート出力)
- Automated generation of Daily Operations Summaries, Weekly Visitor Logs, and Monthly Revenue Audits.
- Direct downloads in **Adobe PDF** (formatted via ReportLab), **Microsoft Excel .xlsx** (via openpyxl), and **CSV**.

### 🛡️ Module 10: Role-Based Access Control & Audit Security (権限管理・監査ログ)
- JWT bearer token authentication with Bcrypt password hashing.
- Strict separation between **Administrator** and **Staff Operator** privileges.
- Immutable security audit log tracking logins, ticket creations, admissions, status overrides, and duplicate rejections.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Lucide React, Recharts, Axios, React Router v7 |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2, HTTPBearer Security |
| **Database** | SQLAlchemy 2.0 ORM, SQLite (local default) / PostgreSQL & Neon Serverless (production) |
| **Machine Learning** | Scikit-learn, Pandas, NumPy (RandomForestRegressor, GradientBoostingRegressor) |
| **Document Export** | ReportLab (PDF), openpyxl (Excel XLSX), Python CSV, Pillow (QR rendering) |
| **DevOps & Containers** | Docker, Docker Compose, Nginx, Render (`render.yaml`), Vercel (`vercel.json`) |

---

## 4. System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SmartPark AI Client                             │
│       React 19 + TypeScript + Tailwind CSS + Lucide + Recharts         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON + JWT Bearer
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FastAPI REST Gateway                            │
│  /auth  /dashboard  /tickets  /attractions  /predictions  /reports     │
└──────────┬────────────────────────┬──────────────────────┬─────────────┘
           │                        │                      │
           ▼                        ▼                      ▼
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│  AI / ML Engine      │ │   Document Engine    │ │  SQLAlchemy ORM      │
│  - RandomForest      │ │  - ReportLab (PDF)   │ │  - 11 Data Models    │
│  - GradientBoosting  │ │  - openpyxl (XLSX)   │ │  - Neon PostgreSQL   │
│  - Heuristic Engine  │ │  - qrcode / PIL      │ │    or SQLite         │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘
```

---

## 5. Database Schema (11 Relational Tables)

1. `users`: System operators & administrators (Bcrypt hashed credentials, role enum).
2. `visitors`: Registered guest profiles, contact information, age groups, nationality, loyalty flag.
3. `tickets`: Digital admissions passes, unique booking references, status (`valid`, `used`, `cancelled`, `refunded`), QR payloads.
4. `ticket_verifications`: Turnstile presentation records, gates, operator IDs, admission status (`success`, `rejected_duplicate`, `rejected_invalid`), previous timestamps.
5. `attractions`: Ride catalog, Japanese nomenclature, hourly throughput, queue limits, current wait times, daily ridership counters.
6. `attraction_visits`: Guest ride validation and queue duration records.
7. `waiting_time_records`: Hourly historical queue telemetry for ML model training.
8. `revenue_records`: Daily financial logs across ticket admissions, merchandise, and food & beverage.
9. `visitor_forecasts`: 7-day machine-learned attendance and revenue projections with confidence intervals.
10. `reports`: Archive of generated executive documents (file paths, formats, timestamps).
11. `audit_logs`: Immutable security event telemetry (actions, actors, IP addresses, resource targets).

---

## 6. Machine Learning Methodology

### Model 1: Queue Wait Time Predictor
- **Algorithm**: `RandomForestRegressor` ($n=100$, $\text{max\_depth}=12$).
- **Features**: `[attraction_id, hourly_capacity, popularity_multiplier, hour_of_day, day_of_week, is_weekend, is_holiday, weather_code, crowd_factor]`.
- **Validation**: $R^2 = 0.970$, $\text{MAE} = 5.99\text{ minutes}$.

### Model 2: 7-Day Park Attendance Forecaster
- **Algorithm**: `GradientBoostingRegressor` ($n=120$, $\text{learning\_rate}=0.08$, $\text{max\_depth}=5$).
- **Features**: `[day_of_week, month, is_weekend, is_holiday, temperature, rain_mm]`.
- **Validation**: $R^2 = 0.977$, $\text{MAE} = 295.8\text{ visitors}$.

*Data Provenance Notice: All demonstration data is synthetically calibrated to reflect the real-world operational curves and physical constraints of Fuji-Q Highland.*

---

## 7. Quick Start & Local Setup

### Demonstration Credentials
- **System Administrator**: `admin@fujiq.jp` / `Admin@FujiQ2026!` (Full administrative access, reports, user control)
- **Gate Staff Operator**: `staff@fujiq.jp` / `Staff@FujiQ2026!` (Ticketing issuance, turnstile scanner, ride status)

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Train AI models and seed 5,000 visitors + 3 months of telemetry
python -m app.ml.train_models
python -m app.seed_data

# Launch FastAPI development server
uvicorn app.main:app --reload --port 8000
```
Backend API will be accessible at: `http://localhost:8000`  
Interactive Swagger documentation: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend web application will run at: `http://localhost:5173`

---

## 8. Automated Testing

Run the full pytest automated test suite covering authentication, ticket lifecycle, turnstile duplicate prevention, attraction controls, AI model predictions, and report generation:

```bash
cd backend
python -m pytest tests/test_smartpark.py -v
```
All 9 test suites pass with comprehensive edge-case assertions.

---

## 9. Docker & Production Deployment

### Docker Compose
Launch the entire containerized full-stack platform:
```bash
docker-compose up --build
```
- Web Application: `http://localhost:3000`
- API Gateway: `http://localhost:8000`

### Neon PostgreSQL Setup
To connect to a managed PostgreSQL cluster (e.g., Neon or Render):
```bash
export DATABASE_URL="postgresql://user:password@ep-sample-pool.ap-southeast-1.aws.neon.tech/smartpark?sslmode=require"
```
The application will automatically detect PostgreSQL and configure pooling parameters.

### Cloud Deployment
- **Frontend**: Deploy `frontend/` to **Vercel** with SPA rewrites configured in `vercel.json`. Set environment variable `VITE_API_URL` to your backend URL.
- **Backend**: Deploy `backend/` to **Render** using the included `render.yaml` specification.

---

## 10. Author & Contribution

Developed as a flagship enterprise portfolio demonstration showcasing full-stack software engineering, database architecture, AI/ML operational modeling, and Digital Transformation (DX) capabilities for destination amusement parks.
