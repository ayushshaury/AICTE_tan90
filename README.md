# AICTE 90* — Regulatory Compliance & Document Scrutiny Assistant

> **Smart India Hackathon / AICTE Problem Statement PS 26261:**  
> *AI-Powered Application Validation, Document Authentication and Regulatory Compliance Verification*

---

## 1. Project Overview & Scope

**AICTE 90*** is a secure, institutional application-scrutiny platform built for the All India Council for Technical Education (AICTE). It assists authorized scrutiny officers and committees in verifying institutional applications (Extension of Approval, new programmes, intake variations, and detail changes) against regulatory requirements and supporting documentation.

### Core Principles & Ethical Boundaries
- **Advisory Decision Support:** AI outputs and automated checks are strictly advisory. The system **never** automatically rejects applications, declares documents forged, or grants final statutory approvals.
- **Traceable Evidence:** Every finding links directly to supporting certificate pages, extracted parameter snippets, and evaluated rule versions.
- **Honest Labeling:** All mock checks, simulated issuer verifications, and synthetic demo fixtures are explicitly disclosed.

---

## 2. Architecture & Service Boundaries

```text
React 19 + TypeScript (Vite + Tailwind CSS)
            │
            │  HTTPS / Cookie-Bearer Auth
            ▼
Express + TypeScript Application Gateway (Port 4000)
  ├── Multi-tenant RBAC (Institution Isolation)
  ├── Application Scrutiny Workflow State Machine
  ├── Private File Storage & SHA-256 Duplicate Check
  ├── Deterministic Compliance Rule Engine
  ├── Append-only Cryptographic Audit Logger
  └── Prisma ORM
            │
      ┌─────┴────────────────────────┐
      ▼                              ▼
PostgreSQL Database       AiServiceClient Adapter
                            ├── MOCK Mode (Deterministic Fixtures)
                            └── FASTAPI Mode (External Colab Service)
```

- **Browser Isolation:** The browser communicates exclusively with Express. It never calls the internal AI microservice directly.
- **Private Storage:** Uploaded certificates reside outside the web root and are streamed only via authenticated, authorized endpoints.

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router v7, Lucide Icons, Recharts
- **Backend:** Node.js v24, Express, TypeScript, Prisma ORM, PostgreSQL, Zod, Helmet, Multer, Bcrypt, JWT
- **AI Integration Boundary:** Typed `AiServiceClient` adapter with Mock Mode and FastAPI connectivity
- **Testing:** Native Node.js Test Runner with `tsx` (`node:test`, `node:assert`)

---

## 4. Quick Start & Setup

### Prerequisites
- **Node.js:** v20+ (tested on Node v24)
- **PostgreSQL:** Port 5432 running locally or in Docker

### Step 1: Install Dependencies
```bash
# In SIH2 root directory:
npm install

# Install backend packages:
cd backend && npm install

# Install frontend packages:
cd ../frontend && npm install
```

### Step 2: Environment Configuration
Copy the sample environment files:
```bash
# Backend configuration:
cp backend/.env.example backend/.env

# Frontend configuration:
cp frontend/.env.example frontend/.env
```

Default PostgreSQL connection in `backend/.env`:
```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aicte_verifyai
PORT=4000
FRONTEND_ORIGIN=http://localhost:5173
JWT_SECRET=aicte_verifyai_super_secret_jwt_key_2026_dev
AI_SERVICE_MODE=mock
UPLOAD_DIR=./private-uploads
MAX_UPLOAD_MB=20
```

### Step 3: Run Database Migrations & Seed
```bash
cd backend
npx prisma db push
npx prisma db seed
```

This provisions all PostgreSQL tables and seeds 6 realistic synthetic institutions, 6 applications across different stages, documents, findings, and demo personas.

### Step 4: Run Application (Development or Production)

#### Option A: Quick Concurrent Development Run (From Root)
```powershell
# Starts both Backend (Port 4000) and Frontend (Port 5173) simultaneously:
npm run dev
```

Or run individually:
```powershell
# Terminal 1: Backend Express Gateway (Port 4000)
npm run dev:backend

# Terminal 2: Frontend Vite Workspace (Port 5173)
npm run dev:frontend
```

#### Option B: Production Build & Run (Native Node)
```powershell
# Build both frontend and backend bundles:
npm run build

# Start the unified production server (serves API and compiled React SPA on port 4000):
npm start
```

#### Option C: Deploy Whole Application with Docker
You can deploy the whole application (frontend + backend) with a single Dockerfile:

```powershell
# 1. Build the unified container:
docker build -t aicte-portal .

# 2. Run container (serves both API and React SPA on port 4000):
docker run -p 4000:4000 -e DATABASE_URL="postgresql://user:pass@host:5432/aicte_verifyai" aicte-portal
```

Or deploy the entire stack with PostgreSQL using Docker Compose:
```powershell
docker compose up --build
```


### Step 5: Optional Python AI Microservice (`backend/ai-service/`)
The Python AI document scrutiny service (`verifyai_service.py`) runs as an internal microservice on port 8001:
```powershell
cd backend/ai-service

# Create virtual environment and activate:
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies:
pip install -r requirements.txt

# Start the AI microservice on port 8001:
python -m uvicorn verifyai_service:app --host 127.0.0.1 --port 8001
```

Verify service health:
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8001/api/v1/health" | ConvertTo-Json
```

---

## 5. Seeded Synthetic Demo Personas

All demo accounts use password: `demo12345`

| Persona / Name | Email | Role | Scope |
| :--- | :--- | :--- | :--- |
| **Smt. Priya Nair** | `officer1@aicte.demo.gov.in` | `OFFICER` | Scrutiny Officer (Engineering & Tech) |
| **Shri Vikram Verma** | `officer2@aicte.demo.gov.in` | `OFFICER` | Scrutiny Officer (Management & IT) |
| **Dr. Arvind Patel** | `applicant.apex@demo.edu.in` | `APPLICANT` | Apex Institute of Technology & Management |
| **Dr. Sunita Deshmukh** | `applicant.saraswati@demo.edu.in` | `APPLICANT` | Saraswati Vidyapeeth College of Engineering |
| **Prof. K. Ramaswamy** | `senior@aicte.demo.gov.in` | `SENIOR_REVIEWER` | Regional Director / Senior Authority |
| **Dr. Rajesh Sharma** | `admin@aicte.demo.gov.in` | `ADMIN` | System Administrator |
| **Demo Auditor** | `viewer@aicte.demo.gov.in` | `DEMO_VIEWER` | Read-only Auditor |

*(The login page features a 1-click Quick Persona selector for effortless evaluation during demos).*

---

## 6. Deterministic Compliance Rules & Anomaly Checks

1. **Mandatory Regulatory Affidavit (`RULE_REQ_AFFIDAVIT`):** Verifies sworn stamp paper undertaking is uploaded.
2. **Previous Session EoA Letter (`RULE_REQ_PREV_EOA`):** Verifies preceding year approval letter for EoA and Intake Change submissions.
3. **Document Expiration Check (`RULE_DOC_EXPIRY_CHECK`):** Compares extracted expiration dates on Fire Safety NOCs and structural stability certificates against scrutiny dates.
4. **Legal Entity Name Consistency (`RULE_NAME_CONSISTENCY`):** Reconciles extracted institution titles on certificates with registry headers.
5. **Exact Duplicate File Detection (`RULE_DUPLICATE_FILE_HASH`):** Flags duplicate uploads across categories using SHA-256 cryptographic checksums.

---

## 7. Python AI Microservice Integration Contract

The internal Python AI microservice (`verifyai_service.py`) provides:
- `GET /health` and `GET /api/v1/health`
- `POST /api/v1/analyze-document` (Multipart form-data with field `file`, protected by header `X-AI-Service-Token`)

Configuration in `server/.env`:
```dotenv
AI_SERVICE_MODE=fastapi
AI_SERVICE_URL=http://127.0.0.1:8001
AI_SERVICE_TOKEN=aicte_verifyai_internal_token_secret
```

The Express gateway validates requests, streams the secure file to `verifyai_service.py`, normalizes findings, updates processing status (`REQUIRES_REVIEW` or `SUCCEEDED`), and persists extracted fields and findings into PostgreSQL.

---

## 8. Test Execution & Verification

Run the full automated test suite:
```powershell
cd backend
npm test
```

Test results:
- **Python AI Microservice Integration Suite:**
  - Health check verification (`GET /api/v1/health` ➔ 200 OK)
  - End-to-end PDF processing through FastAPI and extracted fields persistence
- **Authentication & Token Security Suite:**
  - Signed JWT generation with role-based claims
- **Compliance & AI Adapter Suite:**
  - Deterministic mock AI analysis adapter
  - Document expiration anomaly detection
  - SHA-256 cryptographic checksum calculation

