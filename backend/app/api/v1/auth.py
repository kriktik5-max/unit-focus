"""API аутентификации и профиля пользователя."""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Plan, Subscription, User
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
    tax_mode: str
    vat_rate: float

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
    days_left: int | None  # None если безлимитно (платный план)
    is_active: bool


class UpdateSettingsRequest(BaseModel):
    tax_mode: str = Field(pattern="^(none|self_employed|usn_6|usn_15|osno)$")
    vat_rate: float = Field(ge=0, le=30)


class MeResponse(BaseModel):
    user: UserOut
    plan: PlanOut
    subscription: SubscriptionOut


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
# Эндпоинты
# ============================================================

@router.post("/register", response_model=AuthResponse, status_code=201)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """Регистрация нового пользователя + автоматический пробный доступ на 10 дней."""
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
    db.flush()

    # Автоматически выдаём пробный доступ на 10 дней
    trial_plan = db.query(Plan).filter_by(code="free").first()
    if trial_plan:
        trial_days = int((trial_plan.limits or {}).get("trial_days", 10))
        now = datetime.now(timezone.utc)
        db.add(Subscription(
            user_id=user.id,
            plan_id=trial_plan.id,
            status="active",
            source="trial",
            started_at=now,
            expires_at=now + timedelta(days=trial_days),
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
    """Профиль + подписка текущего пользователя."""
    sub = db.query(Subscription).filter_by(user_id=user.id).first()
    if not sub:
        raise HTTPException(status_code=500, detail="У пользователя нет подписки")

    plan = db.get(Plan, sub.plan_id)
    if not plan:
        raise HTTPException(status_code=500, detail="План подписки не найден")

    # Считаем оставшиеся дни пробного доступа
    now = datetime.now(timezone.utc)
    days_left: int | None = None
    is_active = True

    if sub.expires_at is not None:
        exp = sub.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        delta = exp - now
        seconds = delta.total_seconds()
        # Округляем вверх: 9.98 дней → 10
        import math
        days_left = max(math.ceil(seconds / 86400), 0)
        is_active = seconds > 0
    # если expires_at is None — это платный план, безлимит

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
            days_left=days_left,
            is_active=is_active,
        ),
    )


@router.put("/me/settings", response_model=UserOut)
def update_settings(
    payload: UpdateSettingsRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Обновление налогового режима и ставки НДС."""
    user.tax_mode = payload.tax_mode
    from decimal import Decimal
    user.vat_rate = Decimal(str(payload.vat_rate))
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.post("/logout")
def logout():
    """JWT stateless — выход чисто на фронте (удалить токен)."""
    return {"status": "ok"}
