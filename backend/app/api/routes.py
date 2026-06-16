from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.transaction import Transaction
from app.repositories.transaction_repo import create_transaction, dashboard_stats, list_transactions
from app.schemas.transaction import DashboardSummary, TransactionRequest, TransactionResponse
from app.services.detection_service import DetectionService
from app.services.evaluation_service import EvaluationService
from app.services.face_verification import simulate_face_verification

router = APIRouter()
detector = DetectionService()
evaluator = EvaluationService(detector.ensemble)


def build_transaction_response(txn: Transaction) -> TransactionResponse:
    return TransactionResponse(
        id=txn.id,
        user_id=txn.user_id,
        amount=txn.amount,
        transaction_time=txn.transaction_time,
        location=txn.location,
        anomaly_score=txn.anomaly_score,
        ensemble_score=round(
            (0.45 * txn.isolation_forest_score) + (0.35 * txn.one_class_svm_score) + (0.20 * txn.dbscan_score), 4
        ),
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


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/transactions/simulate", response_model=TransactionResponse)
def simulate_payment(payload: TransactionRequest, db: Session = Depends(get_db)) -> TransactionResponse:
    try:
        decision = detector.evaluate(payload.user_id, payload.amount, payload.transaction_time, payload.location)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"Invalid time format: {exc}") from exc

    stored = create_transaction(
        db,
        {
            "user_id": payload.user_id,
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
        "user_id": stored.user_id,
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
    if transaction.classification not in {"REVIEW", "BLOCKED"}:
        raise HTTPException(status_code=400, detail="Face verification is only available for review or blocked transactions")

    verification = simulate_face_verification()
    if verification["approved"]:
        transaction.classification = "SAFE"
        transaction.face_verification_required = 0
        transaction.explanation = "Camera verification completed. Transaction verified and marked safe."
        db.commit()
        db.refresh(transaction)

    return {
        **verification,
        "transaction": jsonable_encoder(build_transaction_response(transaction)),
    }


@router.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)) -> dict[str, bool]:
    transaction = db.query(Transaction).filter_by(id=transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    db.delete(transaction)
    db.commit()
    return {"deleted": True}


@router.get("/transactions/history", response_model=list[TransactionResponse])
def transaction_history(limit: int = 100, db: Session = Depends(get_db)) -> list[TransactionResponse]:
    txns = list_transactions(db, limit=limit)
    return [build_transaction_response(txn) for txn in txns]


@router.get("/analytics/dashboard", response_model=DashboardSummary)
def get_dashboard_analytics(db: Session = Depends(get_db)) -> DashboardSummary:
    return DashboardSummary(**dashboard_stats(db))


@router.get("/analytics/evaluation")
def get_model_evaluation() -> dict:
    return evaluator.summary()
