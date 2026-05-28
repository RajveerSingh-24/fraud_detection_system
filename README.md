# AI Fraud Payment Detection System

Production-style full-stack fraud payment simulation platform focused on unsupervised anomaly detection.

## Stack

- Frontend: React + Vite + Tailwind CSS + Framer Motion + Recharts
- Backend: FastAPI + Python + Scikit-learn
- Database: SQLite (via SQLAlchemy)

## Architecture

```text
fraud_payment_detection/
├── backend/
│   ├── app/
│   │   ├── api/              # REST routes
│   │   ├── core/             # config + db session
│   │   ├── ml/               # feature engineering + unsupervised models
│   │   ├── models/           # SQLAlchemy models
│   │   ├── repositories/     # DB operations
│   │   ├── schemas/          # pydantic contracts
│   │   ├── services/         # detection + explainability + face verify simulation
│   │   └── main.py           # app entrypoint
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/
    │   ├── components/
    │   └── pages/
    └── package.json
```

## Unsupervised Fraud Workflow

1. Transaction submitted with `amount`, `transaction_time`, `location`.
2. Backend feature engineering converts behavior into model-ready vectors.
3. Ensemble runs:
   - Isolation Forest
   - One-Class SVM
   - DBSCAN
4. Model-level anomaly scores are blended into a final `risk_score`.
5. Decision policy maps score to:
   - `SAFE`
   - `REVIEW`
   - `BLOCKED`
6. Explainability engine returns key risk factors.
7. Blocked transactions can trigger simulated face verification endpoint.

## Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API base URL: `http://127.0.0.1:8000/api/v1`

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://127.0.0.1:5173`

## Core API Endpoints

- `GET /api/v1/health`
- `POST /api/v1/transactions/simulate`
- `POST /api/v1/transactions/{id}/face-verify`
- `GET /api/v1/transactions/history?limit=100`
- `GET /api/v1/analytics/dashboard`

## Frontend Pages

- Dashboard
- Payment Simulator
- Fraud Analytics
- Model Comparison
- Transaction History
