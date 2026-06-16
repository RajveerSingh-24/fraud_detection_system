from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "AI Fraud Payment Detection API"
    api_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./fraud_detection.db"

    isolation_forest_contamination: float = 0.08
    one_class_nu: float = 0.1
    dbscan_eps: float = 0.72
    dbscan_min_samples: int = 14
    synthetic_dataset_size: int = 50000


settings = Settings()
