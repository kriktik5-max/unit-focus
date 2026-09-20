"""Настройки приложения. Читаются из .env."""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Bcrypt-хеш пароля администратора (не сам пароль!)
    admin_password_hash: str = ""

    # Время жизни сессионного токена
    session_ttl_hours: int = 24

    # Rate limiting для входа
    rate_limit_attempts: int = 5
    rate_limit_window_minutes: int = 15


settings = Settings()
