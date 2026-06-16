import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import NearestNeighbors
from sklearn.svm import OneClassSVM

from app.core.config import settings
from app.ml.feature_engineering import FeaturePipeline, build_feature_matrix
from app.ml.synthetic_data import SyntheticDataset, generate_behavioral_dataset


class UnsupervisedEnsemble:
    def __init__(self) -> None:
        self.dataset: SyntheticDataset = generate_behavioral_dataset(size=settings.synthetic_dataset_size)
        feature_matrix = build_feature_matrix(
            amounts=self.dataset.amount,
            hours=self.dataset.transaction_hour,
            locations=self.dataset.location,
            user_ids=self.dataset.user_id,
        )
        self.feature_pipeline = FeaturePipeline()
        self.baseline_scaled = self.feature_pipeline.fit_transform(feature_matrix)

        self.isolation_forest = IsolationForest(
            contamination=settings.isolation_forest_contamination,
            random_state=42,
            n_estimators=350,
            max_samples=4096,
        )
        self.one_class_svm = OneClassSVM(gamma=0.14, nu=settings.one_class_nu, kernel="rbf")
        self.dbscan = DBSCAN(eps=settings.dbscan_eps, min_samples=settings.dbscan_min_samples)

        self.isolation_forest.fit(self.baseline_scaled)
        self.one_class_svm.fit(self.baseline_scaled)
        self.dbscan_labels = self.dbscan.fit_predict(self.baseline_scaled)
        core_mask = self.dbscan_labels != -1
        self.dbscan_core_samples = self.baseline_scaled[core_mask]
        if self.dbscan_core_samples.shape[0] < settings.dbscan_min_samples:
            self.dbscan_core_samples = self.baseline_scaled
        self.core_neighbor = NearestNeighbors(n_neighbors=1).fit(self.dbscan_core_samples)

        self.iforest_reference = self.isolation_forest.decision_function(self.baseline_scaled)
        self.svm_reference = self.one_class_svm.decision_function(self.baseline_scaled)
        self.dbscan_reference_distances = self.core_neighbor.kneighbors(self.baseline_scaled, return_distance=True)[0].reshape(-1)

        self.iforest_q_low = float(np.quantile(self.iforest_reference, 0.01))
        self.iforest_q_high = float(np.quantile(self.iforest_reference, 0.99))
        self.svm_q_low = float(np.quantile(self.svm_reference, 0.01))
        self.svm_q_high = float(np.quantile(self.svm_reference, 0.99))
        self.dbscan_q_low = float(np.quantile(self.dbscan_reference_distances, 0.05))
        self.dbscan_q_high = float(np.quantile(self.dbscan_reference_distances, 0.99))

        normal_amounts = self.dataset.amount[self.dataset.anomaly_label == 0]
        self.amount_q005 = float(np.quantile(normal_amounts, 0.005))
        self.amount_q05 = float(np.quantile(normal_amounts, 0.05))
        self.amount_q95 = float(np.quantile(normal_amounts, 0.95))
        self.amount_q995 = float(np.quantile(normal_amounts, 0.995))

    @staticmethod
    def _normalize_inverted(value: float, lower: float, upper: float) -> float:
        if upper <= lower:
            return 0.5
        normalized = (upper - value) / (upper - lower)
        return float(np.clip(normalized, 0.0, 1.0))

    @staticmethod
    def _normalize(value: float, lower: float, upper: float) -> float:
        if upper <= lower:
            return 0.5
        normalized = (value - lower) / (upper - lower)
        return float(np.clip(normalized, 0.0, 1.0))

    def _score_scaled(self, scaled: np.ndarray) -> dict[str, float]:
        iforest_raw = self.isolation_forest.decision_function(scaled)[0]
        svm_raw = self.one_class_svm.decision_function(scaled)[0]
        dbscan_distance = self.core_neighbor.kneighbors(scaled, return_distance=True)[0][0][0]

        isolation_score = self._normalize_inverted(iforest_raw, self.iforest_q_low, self.iforest_q_high)
        svm_score = self._normalize_inverted(svm_raw, self.svm_q_low, self.svm_q_high)
        dbscan_score = self._normalize(dbscan_distance, self.dbscan_q_low, self.dbscan_q_high)

        return {
            "isolation_forest": isolation_score,
            "one_class_svm": svm_score,
            "dbscan": dbscan_score,
        }

    def score(self, sample: np.ndarray) -> dict[str, float]:
        sample_2d = sample.reshape(1, -1)
        scaled = self.feature_pipeline.transform(sample_2d)
        return self._score_scaled(scaled)

    def score_scaled(self, scaled_sample: np.ndarray) -> dict[str, float]:
        sample_2d = scaled_sample.reshape(1, -1)
        return self._score_scaled(sample_2d)
