"""Аутентификация админа: bcrypt-пароль, сессионные токены, защита от брута."""
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from passlib.context import CryptContext
from pydantic import BaseModel

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# === Сессии (в памяти) ===
# Храним {token: expires_at}. При перезапуске сервера сессии сбрасываются —
# это нормально для локальной разработки. В проде заменим на Redis.
_sessions: dict[str, datetime] = {}


def create_session() -> str:
    token = secrets.token_urlsafe(32)
    _sessions[token] = datetime.now(timezone.utc) + timedelta(
        hours=settings.session_ttl_hours
    )
    return token


def verify_session(token: str) -> bool:
    exp = _sessions.get(token)
    if not exp:
        return False
    if datetime.now(timezone.utc) > exp:
        _sessions.pop(token, None)
        return False
    return True


def destroy_session(token: str) -> None:
    _sessions.pop(token, None)


# === Rate limiter (в памяти) ===
_login_attempts: dict[str, list[datetime]] = {}


def check_rate_limit(ip: str) -> None:
    now = datetime.now(timezone.utc)
    window = timedelta(minutes=settings.rate_limit_window_minutes)
    attempts = [t for t in _login_attempts.get(ip, []) if now - t < window]
    if len(attempts) >= settings.rate_limit_attempts:
        _login_attempts[ip] = attempts
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Слишком много попыток входа. Подожди {settings.rate_limit_window_minutes} минут.",
        )
    attempts.append(now)
    _login_attempts[ip] = attempts


def reset_rate_limit(ip: str) -> None:
    _login_attempts.pop(ip, None)


# === Зависимость: защита эндпоинтов ===
def require_admin(x_admin_token: str = Header(default="")) -> None:
    """Проверяет заголовок X-Admin-Token. Если сессия истекла — 401."""
    if not x_admin_token or not verify_session(x_admin_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Требуется авторизация. Войди заново.",
        )


# === Логин / логаут ===
class LoginRequest(BaseModel):
    password: str


class LoginResponse(BaseModel):
    token: str
    expires_in_hours: int


router = APIRouter(prefix="/auth", tags=["admin: auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, request: Request):
    ip = request.client.host if request.client else "unknown"
    check_rate_limit(ip)

    if not settings.admin_password_hash:
        raise HTTPException(
            status_code=500, detail="Пароль администратора не настроен на сервере"
        )

    if not pwd_context.verify(payload.password, settings.admin_password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный пароль"
        )

    reset_rate_limit(ip)
    token = create_session()
    return LoginResponse(token=token, expires_in_hours=settings.session_ttl_hours)


@router.post("/logout")
def logout(x_admin_token: str = Header(default="")):
    destroy_session(x_admin_token)
    return {"status": "logged_out"}
