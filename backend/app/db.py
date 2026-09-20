"""Подключение к PostgreSQL и базовый класс для моделей."""
import getpass

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = f"postgresql+psycopg://{getpass.getuser()}@localhost:5432/unitfocus"

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
