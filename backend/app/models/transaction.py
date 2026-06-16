from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    transaction_time: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[str] = mapped_column(String, nullable=False)

    anomaly_score: Mapped[float] = mapped_column(Float, nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    isolation_forest_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    one_class_svm_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    dbscan_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    classification: Mapped[str] = mapped_column(String, nullable=False, index=True)
    explanation: Mapped[str] = mapped_column(String, nullable=False)
    face_verification_required: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
