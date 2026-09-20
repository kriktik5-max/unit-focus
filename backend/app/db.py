"""Подключение к PostgreSQL и базовый класс для моделей."""
import getpass
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


def _build_database_url() -> str:
    """Возвращает URL подключения.

    Приоритет:
      1. Переменная окружения DATABASE_URL (для продакшена).
      2. Локальный PostgreSQL: {user}@localhost:5432/unitfocus.
    """
    env_url = os.environ.get("DATABASE_URL", "").strip()
    if env_url:
        return env_url
    return f"postgresql+psycopg://{getpass.getuser()}@localhost:5432/unitfocus"


DATABASE_URL = _build_database_url()

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
