from dataclasses import dataclass

import numpy as np


CITY_POOL = np.array(
    [
        "mumbai",
        "delhi",
        "bengaluru",
        "hyderabad",
        "chennai",
        "kolkata",
        "pune",
        "ahmedabad",
        "jaipur",
        "lucknow",
        "kochi",
        "surat",
    ]
)


@dataclass
class SyntheticDataset:
    transaction_id: np.ndarray
    user_id: np.ndarray
    amount: np.ndarray
    transaction_hour: np.ndarray
    transaction_time: np.ndarray
    location: np.ndarray
    anomaly_label: np.ndarray


def _time_from_hour(hour: int, rng: np.random.Generator) -> str:
    minute = int(rng.integers(0, 60))
    return f"{hour:02d}:{minute:02d}"


def generate_behavioral_dataset(size: int = 50000, n_users: int = 900, seed: int = 42) -> SyntheticDataset:
    rng = np.random.default_rng(seed)

    user_ids = np.arange(1, n_users + 1)
    user_mean_amount = rng.uniform(450, 8500, size=n_users)
    user_std_amount = np.maximum(user_mean_amount * rng.uniform(0.08, 0.32, size=n_users), 90)
    user_preferred_hour = rng.integers(7, 23, size=n_users)
    user_secondary_hour = (user_preferred_hour + rng.integers(1, 6, size=n_users)) % 24

    preferred_locations = np.stack(
        [rng.choice(CITY_POOL, size=3, replace=False) for _ in range(n_users)],
        axis=0,
    )

    tx_user_index = rng.integers(0, n_users, size=size)
    chosen_user_id = user_ids[tx_user_index]

    amounts = rng.normal(
        user_mean_amount[tx_user_index],
        user_std_amount[tx_user_index],
        size=size,
    )
    amounts = np.clip(amounts, 50, 120000)

    preferred_mask = rng.random(size) < 0.88
    hours = np.where(
        preferred_mask,
        (user_preferred_hour[tx_user_index] + rng.integers(-2, 3, size=size)) % 24,
        (user_secondary_hour[tx_user_index] + rng.integers(-2, 3, size=size)) % 24,
    )

    location_pick = rng.integers(0, 3, size=size)
    locations = preferred_locations[tx_user_index, location_pick]

    anomaly_labels = np.zeros(size, dtype=int)
    anomaly_mask = rng.random(size) < 0.075
    anomaly_indices = np.where(anomaly_mask)[0]
    anomaly_labels[anomaly_indices] = 1

    if anomaly_indices.size > 0:
        split_1 = int(anomaly_indices.size * 0.45)
        split_2 = int(anomaly_indices.size * 0.75)

        amount_idx = anomaly_indices[:split_1]
        time_idx = anomaly_indices[split_1:split_2]
        location_idx = anomaly_indices[split_2:]

        amounts[amount_idx] = amounts[amount_idx] * rng.uniform(2.4, 7.2, size=amount_idx.size)
        amounts[amount_idx] = np.clip(amounts[amount_idx], 8000, 250000)

        unusual_hours = rng.choice(np.array([0, 1, 2, 3, 4, 5, 23]), size=time_idx.size, replace=True)
        hours[time_idx] = unusual_hours

        for idx in location_idx:
            user_pref_set = set(preferred_locations[tx_user_index[idx]].tolist())
            uncommon = [city for city in CITY_POOL.tolist() if city not in user_pref_set]
            if not uncommon:
                uncommon = CITY_POOL.tolist()
            locations[idx] = rng.choice(uncommon)

    tx_ids = np.array([f"TXN-{i:07d}" for i in range(1, size + 1)])
    tx_time = np.array([_time_from_hour(int(h), rng) for h in hours])

    return SyntheticDataset(
        transaction_id=tx_ids,
        user_id=chosen_user_id,
        amount=amounts.astype(float),
        transaction_hour=hours.astype(int),
        transaction_time=tx_time,
        location=locations,
        anomaly_label=anomaly_labels,
    )
