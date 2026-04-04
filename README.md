# GigShield — AI-Powered Parametric Insurance for Delivery Workers

**Parametric income-loss insurance for India's gig economy delivery workers (Zomato & Swiggy partners).**

---

## Problem Statement

India's gig economy delivery workers — over 10 million active riders on platforms like Zomato and Swiggy — face constant income disruption from weather events (monsoon flooding, cyclones), air quality crises, and urban curfews or strikes. Unlike formal-sector employees, they have no employer-backed insurance, no sick leave, and no safety net. A single week of heavy rainfall in Mumbai can wipe out 80% of a delivery partner's expected earnings with zero compensation.

Traditional insurance models fail these workers: claim processes are slow and complex, premiums are unaffordable, and coverage doesn't match the weekly income cycle of gig work. **GigShield** solves this with *parametric insurance* — a model where claims are triggered automatically by measurable external events (rainfall thresholds, AQI levels, curfew announcements) with no manual filing required. Premiums are charged weekly at 3% of income, and payouts are instant, calculated as a direct percentage of the worker's lost income.

---

## Architecture

<img width="1006" height="468" alt="image" src="https://github.com/user-attachments/assets/f4431bf8-edcd-4d3e-9787-5b510f138852" />


## Pricing Model

GigShield uses a transparent, three-factor weekly premium calculation:

```
weekly_premium = base_premium × zone_risk_multiplier × weather_risk_factor
```

| Component | Formula | Range |
|---|---|---|
| **Base Premium** | `avg_weekly_income × 0.03` (3%) | — |
| **Zone Risk Multiplier** | City-based historical flood data | 1.0 – 1.5 |
| **Weather Risk Factor** | Season + city combination | 1.0 – 1.3 |
| **Coverage Amount** | `avg_weekly_income × 0.80` (80% replacement) | — |

### Example: Mumbai Worker Earning ₹8,000/week

| Step | Calculation | Result |
|---|---|---|
| Base Premium | ₹8,000 × 0.03 | ₹240 |
| Zone Risk (Mumbai) | × 1.50 | ₹360 |
| Weather Risk (Monsoon) | × 1.30 | **₹468/week** |
| Coverage | ₹8,000 × 0.80 | **₹6,400** |

> The worker pays **₹468/week** and is covered for up to **₹6,400** of income loss per disruption event.

---

## Parametric Triggers

| Event Type | Threshold | Auto-Action |
|---|---|---|
| **Rainfall** | > 50 mm in 24 hours in worker's city | Auto-create `income_loss` claim for all active policies in affected city |
| **AQI** | > 300 in worker's zone | Auto-create `income_loss` claim for all active policies in affected city |
| **Curfew / Strike** | Boolean flag = `true` for city | Auto-create `income_loss` claim for all active policies in affected city |

**Severity-based payout ratios:**

| Severity | Payout (% of coverage) |
|---|---|
| Low | 25% |
| Medium | 50% |
| High | 75% |
| Critical | 100% |

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL async connection string | `postgresql+asyncpg://gigshield:password@localhost:5432/gigshield` |
| `SECRET_KEY` | JWT signing secret | `your-jwt-secret-here` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT token expiry | `60` |
| `USE_MOCK_APIS` | Use mock external APIs (weather, platform) | `true` |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API key (live mode) | — |
| `RAZORPAY_KEY_ID` | Razorpay payment gateway key ID | — |
| `RAZORPAY_KEY_SECRET` | Razorpay payment gateway secret | — |

---

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | No | Health check |
| `GET` | `/health` | No | Detailed health status |
| `POST` | `/api/v1/workers/register` | No | Register a new delivery worker |
| `POST` | `/api/v1/workers/login` | No | Login with phone + OTP → JWT |
| `GET` | `/api/v1/workers/me` | Yes | Get authenticated worker's profile |
| `POST` | `/api/v1/pricing/calculate` | Yes | Calculate weekly premium for worker |
| `POST` | `/api/v1/policies` | Yes | Create a new weekly insurance policy |
| `GET` | `/api/v1/policies/me` | Yes | List all policies for worker |
| `GET` | `/api/v1/policies/{policy_id}` | Yes | Get policy detail |
| `POST` | `/api/v1/events/trigger` | No* | Ingest disruption event → auto-create claims |
| `POST` | `/api/v1/events/simulate/mock` | No* | Run randomized mock disruptions through the same auto-claim pipeline |
| `GET` | `/api/v1/claims/me` | Yes | List all claims for worker |
| `GET` | `/api/v1/claims/{claim_id}` | Yes | Get claim detail |
| `GET` | `/api/v1/payouts/me` | Yes | List payout history |
| `POST` | `/api/v1/payouts/{claim_id}/process` | Yes | Process payout for a claim |
| `GET` | `/api/v1/dashboard/worker` | Yes | Worker dashboard summary |
| `GET` | `/api/v1/dashboard/admin` | No* | Admin dashboard summary |

*\*Admin endpoints are open in Phase 1 — role-based access control is planned for Phase 2.*

### New Feature: Mock Risk Simulation & Live Risk Ticker

GigShield now includes a deterministic, policy-aware mock event simulator for local/demo environments and a worker-facing live risk ticker.

**Simulator endpoint:** `POST /api/v1/events/simulate/mock`

- Uses synthetic risk signals (`weather_condition`, `traffic_level`, `precipitation_mm`) and maps them to parametric events (`rainfall`, `aqi`, `curfew_strike`).
- Randomizes event order with optional `seed` support for reproducible demos.
- Guarantees at least one threshold-crossing event in the selected sequence so trigger logic can be validated.
- Executes each event through the same production event engine used by `/api/v1/events/trigger`.

Request body:

```json
{
"max_events": 8,
"seed": 7
}
```

Response highlights:

- `mock_data`: generated source events before shuffle
- `triggered_sequence`: processed events with `claims_created` and `claim_ids`
- `first_threshold_cross_index`: first sequence step where thresholds were crossed
- `first_claim_creation_index`: first sequence step that created a claim
- `total_claims_created`: total claims created across the run

**Worker dashboard live ticker (`GET /api/v1/dashboard/worker`):**

- Adds `risk_today` with rotating weather/traffic/precipitation values.
- Designed for client polling (current UI refreshes every 8 seconds).
- Policy-scoped behavior with three rules.
- No active policy: ticker stays idle.
- Claim already exists for active policy: ticker pauses for that policy.
- New active policy selected: ticker restarts from simulation step 1.

---
 
## AI & ML Features
 
GigShield goes beyond static parametric rules by embedding machine learning at every layer — from risk pricing to payout prediction to real-time urban intelligence.
 
---
 
### 1. City Nervous System — Real-Time Urban Intelligence
 
Instead of relying solely on weather APIs, GigShield plugs into a broader network of urban data streams that no existing insurer monitors. A continuously updated **City Risk Score** (0–100) is computed per zone every 6 hours by aggregating signals from multiple sources:
 
| Data Source | Signal | Trigger Logic |
|---|---|---|
| **Transit disruption feeds** | BMTC/Metro strike or route suspension | When Bangalore transit is down, workers cannot reach their bikes — auto-trigger for affected zones |
| **Google Maps "busy" data** | Petrol pump queue length | Unusually long queues signal a fuel shortage event that grounds two-wheelers — auto-trigger with a 2-hour validation window |
| **Hospital admission spikes** | Dengue, heatwave, or epidemic data | A statistically significant spike in admissions for a city area triggers illness-based income protection without requiring a medical claim |
| **Police permit / rally data** | Protest routing and road closures | If a 2 km radius around a worker's active zone is blocked by a permitted political rally, GPS cross-validation confirms disruption and auto-triggers the claim |
 
**ML Model:** A gradient boosting classifier (XGBoost) is trained on historical disruption-to-income-loss correlation data per city. Incoming urban signals are scored against this model in real time, and only signals with a disruption probability above a configurable threshold (default: 0.75) proceed to claim creation. This eliminates false positives from minor inconveniences while catching genuine income-blocking events.
 
```
urban_signals → feature_vector → XGBoost disruption_classifier
                                        │
                              disruption_probability > 0.75?
                                    ↓ yes
                         GPS validate worker in affected zone?
                                    ↓ yes
                              auto-create claim
```
 
**Why this matters:** Weather is only one of five major income disruption categories for Indian gig workers. City Nervous System coverage means GigShield is the only insurer that protects workers from the full spectrum of urban disruptions — including ones workers themselves cannot predict or report.
 
---
 
### 2. AI Rating Sentinel — Algorithmic Deactivation Insurance
 
Platform algorithms have effectively become the employer for India's delivery workers. A single bad rating cycle — whether caused by a system bug, a targeted complaint campaign, or an opaque algorithmic penalty — can slash a worker's income by 40% overnight with no explanation and no recourse. Zero insurers cover this risk today.
 
**GigShield's AI Rating Sentinel** monitors each worker's platform rating trajectory and detects drops that are statistically inconsistent with legitimate complaint patterns:
 
**How it works:**
 
1. **LSTM Trajectory Model** — a Long Short-Term Memory model is trained on each worker's historical rating time series, capturing their normal rating volatility, complaint frequency, and seasonal patterns.
 
2. **Anomaly Detection** — when an observed rating drop deviates significantly from the LSTM's predicted trajectory (e.g., 4.8 → 3.1 within 48 hours with no corresponding increase in complaints), the drop is flagged as a potential algorithmic event rather than a merit-based one.
 
3. **Algorithmic Disruption Payment** — upon flagging, GigShield auto-triggers an `algorithmic_disruption` claim type and processes a partial income protection payout covering the earnings gap during the anomaly window.
 
4. **Legal-Grade Evidence Report** — the system auto-generates a timestamped report containing the rating trajectory graph, statistical deviation scores, complaint-to-rating correlation analysis, and platform interaction logs. Workers can use this report to formally appeal deactivation with Zomato/Swiggy or with the gig worker dispute resolution bodies established under India's Platform Aggregators policy framework.
 
```
worker_rating_history → LSTM trajectory model
                               │
                     predicted_rating ± confidence_band
                               │
              actual_rating < lower_confidence_bound?
                         ↓ yes
              complaint_volume_spike detected?
                         ↓ no
         flag as ALGORITHMIC_DISRUPTION_EVENT
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
   auto-trigger claim          generate legal evidence
   income_protection           report (PDF) for worker
   payout (50% coverage)       appeal package
```
 
**Claim type added to schema:** `algorithmic_disruption` alongside existing `income_loss`.
 
**Why this matters:** This makes GigShield the only insurance product in the world that protects gig workers *from the platforms themselves* — addressing the single biggest uninsured risk in the gig economy.
 

###  Phase 1 — Seed (Weeks 1-2) *← Current*
- Complete API scaffold with all endpoints
- SQLAlchemy models + Alembic migrations
- Pricing engine with 3-factor formula
- Parametric event trigger → auto-claim pipeline
- Mock external APIs (weather, platform, payment)
- Fraud detection stubs (duplicate claim, GPS mismatch)
- JWT authentication with OTP stub
- Worker & admin dashboards
- Docker Compose + PostgreSQL

## Future Additions

1. **Fraud avoidance while onboarding (high priority).**
2. **Real location verification** to validate the worker's live location against declared onboarding city/zone.
3. **Video verification of active worker status during onboarding (via screenshare)** by showing the worker profile in rider apps like Zomato or the Swiggy delivery partner app.
4. **Standard insurance exclusions framework** covering policy exclusions such as war, pandemic/epidemic, and terrorism.
5. **Actuarial sustainability modeling** including premium adequacy checks, expected-loss forecasting, reserve planning, and portfolio loss-ratio analysis.
6. **Expanded disruption scenario library** beyond weather/pollution (for example fuel shortage, platform outage, transport shutdown, civic unrest, and localized public health spikes).
7. **Accessibility-first worker experience** with vernacular language support, low-digital-literacy onboarding flows, and assisted guidance for policy and claim journeys.


---

## Tech Stack

| Component | Technology |
|---|---|
| **Framework** | FastAPI (async) |
| **ORM** | SQLAlchemy 2.0 (async) |
| **Database** | PostgreSQL 15 |
| **Migrations** | Alembic |
| **Auth** | JWT (`python-jose`) + OTP stub (`passlib`) |
| **Scheduler** | APScheduler (async) |
| **HTTP Client** | httpx (async) |
| **Validation** | Pydantic v2 |
| **Testing** | pytest + httpx AsyncClient |
| **Env Config** | pydantic-settings |
| **Containerisation** | Docker Compose |

---

## Setup Instructions

### Prerequisites

- **Python 3.11+**
- **Docker & Docker Compose**
- **Node.js 20+**
- **pip**

### Project Layout Note

- Frontend app is in `client/`
- FastAPI backend is in `server/`

### 1. Clone & Install

```bash
cd Guidewire
python3 -m venv server/.venv
source server/.venv/bin/activate
pip install -r server/requirements.txt
cd client && npm ci && cd ..
```

### 2. Start PostgreSQL

```bash
docker compose -f server/docker-compose.yml up -d postgres
```

### 3. Configure Environment

```bash
cp server/.env.example server/.env
# Edit server/.env with your settings (defaults work for local dev)
```

### 4. Run Migrations

```bash
cd server
source .venv/bin/activate
alembic upgrade head
```

### 5. Start Server

```bash
cd server
source .venv/bin/activate
uvicorn app.main:app --reload
```

API docs available at: **http://localhost:8000/docs**

---

## Cross-Platform Integration Testing

These scripts run setup + full verification for backend and frontend.

### Included Checks

- Backend pytest suite (`server/tests`)
- Real ML inference call through `server/app/services/severity_prediction.py`
- Backend health smoke check (`GET /health` via in-process ASGI client)
- Frontend lint (`npm run lint`)
- Frontend build (`npm run build`)
- Optional Docker/Postgres startup check

### macOS / Linux (One Command)

```bash
bash scripts/setup-and-test.sh
```

Skip optional Docker check:

```bash
SKIP_DOCKER_CHECK=1 bash scripts/setup-and-test.sh
```

### Windows PowerShell (One Command)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-and-test.ps1
```

Skip optional Docker check:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-and-test.ps1 -SkipDockerCheck
```

### Preflight Only

macOS/Linux:

```bash
bash scripts/preflight.sh
```

Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\preflight.ps1
```

### Fresh Laptop Notes

- Frontend Node version is pinned in `client/.nvmrc`.
- Frontend env template is available at `client/.env.example`.
- Backend env template is available at `server/.env.example`.
- Model artifacts must exist for full ML integration validation:
      - `notebooks/xg_bost.pkl`
      - `data/processed/gigshield_training_ready.csv`
- If ML runtime check fails on macOS with `libomp.dylib` error, install OpenMP:

```bash
brew install libomp
```

---

## License

MIT — Built for the Guidewire Hackathon 2026.