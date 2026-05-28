from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.transaction import Transaction
from app.repositories.transaction_repo import create_transaction, dashboard_stats, list_transactions
from app.schemas.transaction import DashboardSummary, TransactionRequest, TransactionResponse
from app.services.detection_service import DetectionService
from app.services.face_verification import simulate_face_verification

router = APIRouter()
detector = DetectionService()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/transactions/simulate", response_model=TransactionResponse)
def simulate_payment(payload: TransactionRequest, db: Session = Depends(get_db)) -> TransactionResponse:
    try:
        decision = detector.evaluate(payload.amount, payload.transaction_time, payload.location)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"Invalid time format: {exc}") from exc

    stored = create_transaction(
        db,
        {
            "amount": payload.amount,
            "transaction_time": payload.transaction_time,
            "location": payload.location,
            "anomaly_score": decision["anomaly_score"],
            "risk_score": decision["risk_score"],
            "isolation_forest_score": decision["model_scores"]["isolation_forest"],
            "one_class_svm_score": decision["model_scores"]["one_class_svm"],
            "dbscan_score": decision["model_scores"]["dbscan"],
            "classification": decision["classification"],
            "explanation": decision["explanation"],
            "face_verification_required": 1 if decision["face_verification_required"] else 0,
        },
    )
    response_payload = {
        **decision,
        "id": stored.id,
        "amount": stored.amount,
        "transaction_time": stored.transaction_time,
        "location": stored.location,
        "created_at": stored.created_at,
    }
    return TransactionResponse(**response_payload)


@router.post("/transactions/{transaction_id}/face-verify")
def face_verify_transaction(transaction_id: int, db: Session = Depends(get_db)) -> dict:
    transaction = db.query(Transaction).filter_by(id=transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if transaction.classification != "BLOCKED":
        raise HTTPException(status_code=400, detail="Face verification is only available for blocked transactions")
    return simulate_face_verification()


@router.get("/transactions/history", response_model=list[TransactionResponse])
def transaction_history(limit: int = 100, db: Session = Depends(get_db)) -> list[TransactionResponse]:
    txns = list_transactions(db, limit=limit)
    results: list[TransactionResponse] = []
    for txn in txns:
        results.append(
            TransactionResponse(
                id=txn.id,
                amount=txn.amount,
                transaction_time=txn.transaction_time,
                location=txn.location,
                anomaly_score=txn.anomaly_score,
                risk_score=txn.risk_score,
                classification=txn.classification,
                explanation=txn.explanation,
                face_verification_required=bool(txn.face_verification_required),
                model_scores={
                    "isolation_forest": txn.isolation_forest_score,
                    "one_class_svm": txn.one_class_svm_score,
                    "dbscan": txn.dbscan_score,
                },
                created_at=txn.created_at,
            )
        )
    return results


@router.get("/analytics/dashboard", response_model=DashboardSummary)
def get_dashboard_analytics(db: Session = Depends(get_db)) -> DashboardSummary:
    return DashboardSummary(**dashboard_stats(db))
