"""API аутентификации и профиля пользователя."""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Plan, Subscription, UsageEvent, User
from app.security import (
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


# ============================================================
# Pydantic-схемы
# ============================================================

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(default="", max_length=255)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str

    class Config:
        from_attributes = True


class PlanOut(BaseModel):
    code: str
    name: str
    price_monthly: float
    limits: dict

    class Config:
        from_attributes = True


class SubscriptionOut(BaseModel):
    status: str
    started_at: datetime
    expires_at: datetime | None
    source: str


class UsageOut(BaseModel):
    used_this_month: int
    limit: int
    remaining: int | None  # None = безлимит


class MeResponse(BaseModel):
    user: UserOut
    plan: PlanOut
    subscription: SubscriptionOut
    usage: UsageOut


class AuthResponse(BaseModel):
    token: str
    user: UserOut


# ============================================================
# Зависимость: получить текущего юзера по JWT
# ============================================================

def get_current_user(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
) -> User:
    """Достаёт юзера из заголовка Authorization: Bearer <token>."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Требуется авторизация (заголовок Authorization)",
        )
    token = authorization.removeprefix("Bearer ").strip()
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Токен недействителен или истёк",
        )
    user_id = int(payload.get("sub", 0))
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь не найден или деактивирован",
        )
    return user


# ============================================================
# Утилита: посчитать использованные расчёты за 30 дней
# ============================================================

def _usage_this_month(db: Session, user_id: int) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    return (
        db.query(UsageEvent)
        .filter(
            UsageEvent.user_id == user_id,
            UsageEvent.event_type == "calculation",
            UsageEvent.created_at >= cutoff,
        )
        .count()
    )


# ============================================================
# Эндпоинты
# ============================================================

@router.post("/register", response_model=AuthResponse, status_code=201)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """Регистрация нового пользователя + автоматическая Free-подписка."""
    existing = db.query(User).filter_by(email=payload.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Пользователь с таким email уже существует",
        )

    user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    db.flush()  # получаем user.id

    # Автоматически выдаём Free-подписку
    free_plan = db.query(Plan).filter_by(code="free").first()
    if free_plan:
        db.add(Subscription(
            user_id=user.id,
            plan_id=free_plan.id,
            status="active",
            source="free",
        ))

    db.commit()
    db.refresh(user)

    token = create_access_token(user_id=user.id, email=user.email)
    return AuthResponse(token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Вход по email и паролю. Возвращает JWT-токен."""
    user = db.query(User).filter_by(email=payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Аккаунт деактивирован",
        )
    token = create_access_token(user_id=user.id, email=user.email)
    return AuthResponse(token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=MeResponse)
def me(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Профиль + подписка + лимиты текущего пользователя."""
    sub = db.query(Subscription).filter_by(user_id=user.id).first()
    if not sub:
        raise HTTPException(status_code=500, detail="У пользователя нет подписки")

    plan = db.get(Plan, sub.plan_id)
    if not plan:
        raise HTTPException(status_code=500, detail="План подписки не найден")

    limit = int(plan.limits.get("calculations_per_month", 0))
    used = _usage_this_month(db, user.id)
    remaining = None if limit == -1 else max(limit - used, 0)

    return MeResponse(
        user=UserOut.model_validate(user),
        plan=PlanOut(
            code=plan.code,
            name=plan.name,
            price_monthly=float(plan.price_monthly),
            limits=plan.limits,
        ),
        subscription=SubscriptionOut(
            status=sub.status,
            started_at=sub.started_at,
            expires_at=sub.expires_at,
            source=sub.source,
        ),
        usage=UsageOut(
            used_this_month=used,
            limit=limit,
            remaining=remaining,
        ),
    )


@router.post("/logout")
def logout():
    """JWT stateless — выход чисто на фронте (удалить токен)."""
    return {"status": "ok"}
