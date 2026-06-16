from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class TransactionRequest(BaseModel):
    user_id: int = Field(gt=0)
    amount: float = Field(gt=0)
    transaction_time: str
    location: str


class ModelScores(BaseModel):
    isolation_forest: float
    one_class_svm: float
    dbscan: float


class TransactionDecision(BaseModel):
    anomaly_score: float
    ensemble_score: float
    risk_score: float
    classification: Literal["SAFE", "REVIEW", "BLOCKED"]
    explanation: str
    face_verification_required: bool
    model_scores: ModelScores


class TransactionResponse(TransactionDecision):
    id: int
    user_id: int
    amount: float
    transaction_time: str
    location: str
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    total_transactions: int
    blocked_count: int
    review_count: int
    safe_count: int
    avg_risk_score: float
