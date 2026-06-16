from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.api.routes import router
from app.core.config import settings
from app.core.database import Base, engine

Base.metadata.create_all(bind=engine)


def ensure_schema_compatibility() -> None:
    inspector = inspect(engine)
    if "transactions" not in inspector.get_table_names():
        return
    columns = {col["name"] for col in inspector.get_columns("transactions")}
    if "user_id" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE transactions ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0"))


ensure_schema_compatibility()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix=settings.api_prefix, tags=["fraud-detection"])
