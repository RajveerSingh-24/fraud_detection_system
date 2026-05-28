import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.svm import OneClassSVM

from app.core.config import settings


def generate_baseline_data(size: int = 700) -> np.ndarray:
    rng = np.random.default_rng(42)

    amount = rng.normal(loc=4200, scale=1500, size=size).clip(50, 20000)
    hour = rng.integers(low=8, high=22, size=size)
    location = rng.choice([1, 2, 3, 4, 5, 6, 7, 8], size=size, p=[0.2, 0.16, 0.2, 0.11, 0.1, 0.09, 0.08, 0.06])

    hour_sin = np.sin(2 * np.pi * (hour / 24))
    hour_cos = np.cos(2 * np.pi * (hour / 24))
    normalized_amount = np.log1p(amount)

    return np.column_stack((normalized_amount, hour_sin, hour_cos, location))


class UnsupervisedEnsemble:
    def __init__(self) -> None:
        baseline = generate_baseline_data()
        self.scaler = StandardScaler()
        self.baseline_scaled = self.scaler.fit_transform(baseline)

        self.isolation_forest = IsolationForest(
            contamination=settings.isolation_forest_contamination,
            random_state=42,
            n_estimators=220,
        )
        self.one_class_svm = OneClassSVM(gamma="scale", nu=settings.one_class_nu)
        self.isolation_forest.fit(self.baseline_scaled)
        self.one_class_svm.fit(self.baseline_scaled)

    def score(self, sample: np.ndarray) -> dict[str, float]:
        sample_2d = sample.reshape(1, -1)
        scaled = self.scaler.transform(sample_2d)

        iforest_raw = self.isolation_forest.decision_function(scaled)[0]
        svm_raw = self.one_class_svm.decision_function(scaled)[0]
        dbscan_model = DBSCAN(eps=settings.dbscan_eps, min_samples=settings.dbscan_min_samples)
        labels = dbscan_model.fit_predict(np.vstack([self.baseline_scaled, scaled]))
        dbscan_label = labels[-1]

        isolation_score = float(np.clip((0.5 - iforest_raw) * 0.9, 0, 1))
        svm_score = float(np.clip((0.4 - svm_raw) * 0.9, 0, 1))
        dbscan_score = 1.0 if dbscan_label == -1 else 0.2

        return {
            "isolation_forest": isolation_score,
            "one_class_svm": svm_score,
            "dbscan": dbscan_score,
        }
