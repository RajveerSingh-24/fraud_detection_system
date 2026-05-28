from datetime import datetime
from math import cos, sin, pi

import numpy as np


LOCATION_INDEX = {
    "mumbai": 1,
    "delhi": 2,
    "bengaluru": 3,
    "hyderabad": 4,
    "chennai": 5,
    "kolkata": 6,
    "pune": 7,
    "ahmedabad": 8,
}


def parse_hour(transaction_time: str) -> int:
    parsed = datetime.strptime(transaction_time, "%H:%M")
    return parsed.hour


def location_to_num(location: str) -> int:
    return LOCATION_INDEX.get(location.strip().lower(), 0)


def build_feature_vector(amount: float, transaction_time: str, location: str) -> np.ndarray:
    hour = parse_hour(transaction_time)
    loc = location_to_num(location)

    normalized_amount = np.log1p(amount)
    hour_sin = sin(2 * pi * (hour / 24))
    hour_cos = cos(2 * pi * (hour / 24))

    return np.array([normalized_amount, hour_sin, hour_cos, float(loc)], dtype=float)
