import numpy as np
from sklearn.decomposition import PCA
from sklearn.metrics import average_precision_score, f1_score, precision_score, recall_score, roc_auc_score

from app.ml.models import UnsupervisedEnsemble


class EvaluationService:
    def __init__(self, ensemble: UnsupervisedEnsemble) -> None:
        self.ensemble = ensemble
        self._cached_summary: dict | None = None

    @staticmethod
    def _safe_metric(metric_fn, labels: np.ndarray, scores: np.ndarray) -> float:
        try:
            value = float(metric_fn(labels, scores))
            if np.isnan(value) or np.isinf(value):
                return 0.0
            return value
        except Exception:
            return 0.0

    def _model_scores(self) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        iforest_scores = np.clip(
            (self.ensemble.iforest_q_high - self.ensemble.iforest_reference)
            / (self.ensemble.iforest_q_high - self.ensemble.iforest_q_low + 1e-9),
            0.0,
            1.0,
        )
        svm_scores = np.clip(
            (self.ensemble.svm_q_high - self.ensemble.svm_reference) / (self.ensemble.svm_q_high - self.ensemble.svm_q_low + 1e-9),
            0.0,
            1.0,
        )
        dbscan_distances = self.ensemble.dbscan_reference_distances
        dbscan_scores = np.clip(
            (dbscan_distances - self.ensemble.dbscan_q_low) / (self.ensemble.dbscan_q_high - self.ensemble.dbscan_q_low + 1e-9),
            0.0,
            1.0,
        )
        ensemble_scores = (0.45 * iforest_scores) + (0.35 * svm_scores) + (0.20 * dbscan_scores)
        return iforest_scores, svm_scores, dbscan_scores, ensemble_scores

    def summary(self) -> dict:
        if self._cached_summary is not None:
            return self._cached_summary

        labels = self.ensemble.dataset.anomaly_label
        iforest_scores, svm_scores, dbscan_scores, ensemble_scores = self._model_scores()
        predicted = (ensemble_scores >= 0.55).astype(int)

        sample_size = min(8000, self.ensemble.baseline_scaled.shape[0])
        sample_idx = np.linspace(0, self.ensemble.baseline_scaled.shape[0] - 1, sample_size, dtype=int)
        sampled_scaled = np.nan_to_num(self.ensemble.baseline_scaled[sample_idx], nan=0.0, posinf=1.0, neginf=-1.0)
        sampled_labels = labels[sample_idx]
        sampled_scores = ensemble_scores[sample_idx]

        pca = PCA(n_components=2, random_state=42)
        pca_points = pca.fit_transform(sampled_scaled)

        risk_bins = [0, 0.35, 0.7, 1.0]
        distribution_counts, _ = np.histogram(ensemble_scores, bins=risk_bins)

        compare = {
            "isolation_forest_mean": float(np.mean(iforest_scores)),
            "one_class_svm_mean": float(np.mean(svm_scores)),
            "dbscan_mean": float(np.mean(dbscan_scores)),
            "dbscan_outlier_rate": float(np.mean(self.ensemble.dbscan_labels == -1)),
            "ensemble_auc": self._safe_metric(roc_auc_score, labels, ensemble_scores),
            "ensemble_avg_precision": self._safe_metric(average_precision_score, labels, ensemble_scores),
            "iforest_auc": self._safe_metric(roc_auc_score, labels, iforest_scores),
            "ocsvm_auc": self._safe_metric(roc_auc_score, labels, svm_scores),
            "dbscan_auc": self._safe_metric(roc_auc_score, labels, dbscan_scores),
            "iforest_avg_precision": self._safe_metric(average_precision_score, labels, iforest_scores),
            "ocsvm_avg_precision": self._safe_metric(average_precision_score, labels, svm_scores),
            "dbscan_avg_precision": self._safe_metric(average_precision_score, labels, dbscan_scores),
            "precision_at_threshold": float(precision_score(labels, predicted, zero_division=0)),
            "recall_at_threshold": float(recall_score(labels, predicted, zero_division=0)),
            "f1_at_threshold": float(f1_score(labels, predicted, zero_division=0)),
        }

        sample_idx = np.linspace(0, pca_points.shape[0] - 1, min(1400, pca_points.shape[0]), dtype=int)
        pca_payload = [
            {
                "x": round(float(pca_points[i, 0]), 5),
                "y": round(float(pca_points[i, 1]), 5),
                "is_anomaly": bool(sampled_labels[i]),
                "score": round(float(sampled_scores[i]), 5),
            }
            for i in sample_idx
        ]

        cluster_labels, cluster_counts = np.unique(self.ensemble.dbscan_labels, return_counts=True)
        cluster_payload = [
            {"cluster": int(label), "count": int(count), "is_noise": bool(label == -1)}
            for label, count in zip(cluster_labels, cluster_counts)
        ]

        self._cached_summary = {
            "dataset_size": int(self.ensemble.dataset.amount.shape[0]),
            "anomaly_rate": round(float(np.mean(labels)), 5),
            "risk_distribution": {
                "safe_0_35": int(distribution_counts[0]),
                "review_36_70": int(distribution_counts[1]),
                "blocked_71_100": int(distribution_counts[2]),
            },
            "model_comparison": compare,
            "pca_points": pca_payload,
            "clusters": cluster_payload,
        }
        return self._cached_summary
