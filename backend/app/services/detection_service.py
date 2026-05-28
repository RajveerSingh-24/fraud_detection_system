from app.ml.feature_engineering import build_feature_vector, parse_hour
from app.ml.models import UnsupervisedEnsemble


class DetectionService:
    def __init__(self) -> None:
        self.ensemble = UnsupervisedEnsemble()

    def _explain(self, amount: float, hour: int, location: str, risk_score: float) -> str:
        factors: list[str] = []

        if amount > 12000:
            factors.append("high payment amount")
        if hour < 6 or hour > 23:
            factors.append("unusual transaction time")
        if location.strip().lower() not in {"mumbai", "delhi", "bengaluru", "hyderabad"}:
            factors.append("low-frequency location")
        if risk_score > 0.7:
            factors.append("multi-model anomaly agreement")

        if not factors:
            return "Transaction pattern aligns with normal user behavior."
        return "Risk factors detected: " + ", ".join(factors) + "."

    def evaluate(self, amount: float, transaction_time: str, location: str) -> dict:
        vector = build_feature_vector(amount, transaction_time, location)
        model_scores = self.ensemble.score(vector)

        risk_score = (
            (0.45 * model_scores["isolation_forest"])
            + (0.35 * model_scores["one_class_svm"])
            + (0.20 * model_scores["dbscan"])
        )
        anomaly_score = max(model_scores.values())

        if risk_score >= 0.72:
            classification = "BLOCKED"
        elif risk_score >= 0.42:
            classification = "REVIEW"
        else:
            classification = "SAFE"

        explanation = self._explain(
            amount=amount,
            hour=parse_hour(transaction_time),
            location=location,
            risk_score=risk_score,
        )

        return {
            "anomaly_score": round(float(anomaly_score), 4),
            "risk_score": round(float(risk_score), 4),
            "classification": classification,
            "explanation": explanation,
            "face_verification_required": classification == "BLOCKED",
            "model_scores": {k: round(float(v), 4) for k, v in model_scores.items()},
        }
