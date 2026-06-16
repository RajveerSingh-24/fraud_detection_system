from datetime import datetime
from math import cos, pi, sin

import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import MinMaxScaler, RobustScaler


LOCATION_INDEX = {
    "mumbai": 1,
    "delhi": 2,
    "bengaluru": 3,
    "hyderabad": 4,
    "chennai": 5,
    "kolkata": 6,
    "pune": 7,
    "ahmedabad": 8,
    "jaipur": 9,
    "lucknow": 10,
    "kochi": 11,
    "surat": 12,
}


def parse_hour(transaction_time: str) -> int:
    parsed = datetime.strptime(transaction_time, "%H:%M")
    return parsed.hour


def location_to_num(location: str) -> int:
    return LOCATION_INDEX.get(location.strip().lower(), 0)


def build_feature_vector(amount: float, transaction_time: str, location: str, user_id: int = 0) -> np.ndarray:
    hour = parse_hour(transaction_time)
    loc = location_to_num(location)

    normalized_amount = np.log1p(amount)
    normalized_user = np.log1p(max(user_id, 0))
    angle = 2 * pi * (hour / 24)
    hour_sin = sin(angle)
    hour_cos = cos(angle)

    return np.array([normalized_amount, hour_sin, hour_cos, float(loc), normalized_user], dtype=float)


def build_feature_matrix(
    amounts: np.ndarray, hours: np.ndarray, locations: np.ndarray, user_ids: np.ndarray | None = None
) -> np.ndarray:
    loc_num = np.array([location_to_num(str(loc)) for loc in locations], dtype=float)
    norm_amount = np.log1p(amounts.astype(float))
    angle = 2 * np.pi * (hours.astype(float) / 24.0)
    hour_sin = np.sin(angle)
    hour_cos = np.cos(angle)
    if user_ids is None:
        user_feature = np.zeros_like(norm_amount)
    else:
        user_feature = np.log1p(user_ids.astype(float))
    return np.column_stack((norm_amount, hour_sin, hour_cos, loc_num, user_feature))


class FeaturePipeline:
    def __init__(self) -> None:
        self.pipeline = Pipeline(
            steps=[
                ("robust_scaler", RobustScaler()),
                ("minmax_scaler", MinMaxScaler(feature_range=(0, 1))),
            ]
        )

    def fit_transform(self, X: np.ndarray) -> np.ndarray:
        return self.pipeline.fit_transform(X)

    def transform(self, X: np.ndarray) -> np.ndarray:
        return self.pipeline.transform(X)
