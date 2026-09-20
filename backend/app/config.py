"""Настройки приложения. Читаются из .env."""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Путь к .env в корне backend
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    admin_password: str = "change-me"


settings = Settings()
