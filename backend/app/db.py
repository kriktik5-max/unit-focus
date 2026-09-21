"""Подключение к PostgreSQL и базовый класс для моделей."""
import getpass
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import NullPool


def _build_database_url() -> str:
    """Возвращает URL подключения."""
    env_url = os.environ.get("DATABASE_URL", "").strip()
    if env_url:
        return env_url
    return f"postgresql+psycopg://{getpass.getuser()}@localhost:5432/unitfocus"


DATABASE_URL = _build_database_url()

# Определяем, работаем ли через Supabase
_is_cloud = "supabase" in DATABASE_URL or "pooler" in DATABASE_URL

if _is_cloud:
    # Для облака: без пула, увеличенные таймауты
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        future=True,
        poolclass=NullPool,
        connect_args={
            "connect_timeout": 30,
            "sslmode": "require",
            "options": "-c statement_timeout=120000",
        },
    )
else:
    # Локально: обычный пул
    engine = create_engine(DATABASE_URL, echo=False, future=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """Базовый класс для всех моделей."""
    pass


def get_db():
    """FastAPI-зависимость: выдаёт сессию БД на время запроса."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
