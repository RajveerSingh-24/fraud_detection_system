from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.transaction import Transaction


def create_transaction(db: Session, payload: dict) -> Transaction:
    txn = Transaction(**payload)
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


def list_transactions(db: Session, limit: int = 100) -> list[Transaction]:
    return db.query(Transaction).order_by(Transaction.created_at.desc()).limit(limit).all()


def dashboard_stats(db: Session) -> dict:
    total = db.query(func.count(Transaction.id)).scalar() or 0
    blocked = db.query(func.count(Transaction.id)).filter(Transaction.classification == "BLOCKED").scalar() or 0
    review = db.query(func.count(Transaction.id)).filter(Transaction.classification == "REVIEW").scalar() or 0
    safe = db.query(func.count(Transaction.id)).filter(Transaction.classification == "SAFE").scalar() or 0
    avg_risk = db.query(func.avg(Transaction.risk_score)).scalar() or 0.0
    return {
        "total_transactions": int(total),
        "blocked_count": int(blocked),
        "review_count": int(review),
        "safe_count": int(safe),
        "avg_risk_score": round(float(avg_risk), 4),
    }
