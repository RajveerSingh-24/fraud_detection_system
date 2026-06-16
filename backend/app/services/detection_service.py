import numpy as np

from app.ml.feature_engineering import build_feature_vector, parse_hour
from app.ml.models import UnsupervisedEnsemble


class DetectionService:
    def __init__(self) -> None:
        self.ensemble = UnsupervisedEnsemble()
        self.frequent_locations = self._derive_frequent_locations()
        self.user_profiles = self._build_user_profiles()

    def _derive_frequent_locations(self) -> set[str]:
        locations = self.ensemble.dataset.location
        unique, counts = np.unique(locations, return_counts=True)
        total = counts.sum()
        return {str(loc) for loc, count in zip(unique, counts) if (count / total) >= 0.05}

    def _build_user_profiles(self) -> dict[int, dict]:
        data = self.ensemble.dataset
        profiles: dict[int, dict] = {}
        for user_id in np.unique(data.user_id):
            mask = data.user_id == user_id
            user_amounts = data.amount[mask]
            user_hours = data.transaction_hour[mask]
            user_locations = data.location[mask]
            locs, counts = np.unique(user_locations, return_counts=True)
            common_locations = {str(loc) for loc, count in zip(locs, counts) if count >= 0.12 * counts.sum()}
            profiles[int(user_id)] = {
                "amount_q005": float(np.quantile(user_amounts, 0.005)),
                "amount_q05": float(np.quantile(user_amounts, 0.05)),
                "amount_q95": float(np.quantile(user_amounts, 0.95)),
                "amount_q995": float(np.quantile(user_amounts, 0.995)),
                "hour_mean": float(np.mean(user_hours)),
                "hour_std": float(max(np.std(user_hours), 1.8)),
                "common_locations": common_locations,
            }
        return profiles

    def _explain(self, amount: float, hour: int, location: str, model_scores: dict[str, float], user_profile: dict) -> str:
        factors: list[str] = []

        if amount >= user_profile["amount_q995"]:
            factors.append("amount higher than usual")
        elif amount <= user_profile["amount_q005"]:
            factors.append("amount lower than usual")
        if abs(hour - user_profile["hour_mean"]) > (2.4 * user_profile["hour_std"]):
            factors.append("unusual transaction time")
        if location.strip().lower() not in user_profile["common_locations"]:
            factors.append("unusual location")
        if sum(score >= 0.85 for score in model_scores.values()) >= 2:
            factors.append("high anomaly confidence")

        if not factors:
            return "Transaction pattern aligns with normal user behavior."
        return "Risk factors detected: " + ", ".join(factors) + "."

    def evaluate(self, user_id: int, amount: float, transaction_time: str, location: str) -> dict:
        vector = build_feature_vector(amount, transaction_time, location, user_id=user_id)
        model_scores = self.ensemble.score(vector)
        profile = self.user_profiles.get(
            int(user_id),
            {
                "amount_q005": self.ensemble.amount_q005,
                "amount_q05": self.ensemble.amount_q05,
                "amount_q95": self.ensemble.amount_q95,
                "amount_q995": self.ensemble.amount_q995,
                "hour_mean": 14.0,
                "hour_std": 3.8,
                "common_locations": self.frequent_locations,
            },
        )
        hour = parse_hour(transaction_time)
        user_deviation = 0.0
        if amount > profile["amount_q95"]:
            user_deviation += min(0.45, (amount - profile["amount_q95"]) / max(profile["amount_q95"], 1))
        elif amount < profile["amount_q05"]:
            user_deviation += min(0.3, (profile["amount_q05"] - amount) / max(profile["amount_q05"], 1))
        if abs(hour - profile["hour_mean"]) > (2.0 * profile["hour_std"]):
            user_deviation += 0.28
        if location.strip().lower() not in profile["common_locations"]:
            user_deviation += 0.27
        user_deviation = float(np.clip(user_deviation, 0.0, 1.0))

        normalized_anomaly_score = (
            0.4 * max(model_scores.values()) + 0.6 * (sum(model_scores.values()) / len(model_scores))
        )
        weighted_ensemble_score = (
            (0.45 * model_scores["isolation_forest"])
            + (0.35 * model_scores["one_class_svm"])
            + (0.20 * model_scores["dbscan"])
        )
        weighted_ensemble_score = float(np.clip((0.78 * weighted_ensemble_score) + (0.22 * user_deviation), 0, 1))
        risk_score_100 = round(float(weighted_ensemble_score * 100), 2)

        if risk_score_100 >= 75:
            classification = "BLOCKED"
        elif risk_score_100 >= 55:
            classification = "REVIEW"
        else:
            classification = "SAFE"

        explanation = self._explain(
            amount=amount,
            hour=hour,
            location=location,
            model_scores=model_scores,
            user_profile=profile,
        )

        return {
            "anomaly_score": round(float(normalized_anomaly_score), 4),
            "ensemble_score": round(float(weighted_ensemble_score), 4),
            "risk_score": risk_score_100,
            "classification": classification,
            "explanation": explanation,
            "face_verification_required": classification in {"REVIEW", "BLOCKED"},
            "model_scores": {k: round(float(v), 4) for k, v in model_scores.items()},
        }
