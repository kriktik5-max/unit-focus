"""Модели (таблицы) базы данных."""
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


# ============================================================
# Существующие таблицы (тарифы и налоги — для админки)
# ============================================================

class TariffSetting(Base):
    __tablename__ = "tariff_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    marketplace: Mapped[str] = mapped_column(String(32), index=True)
    key: Mapped[str] = mapped_column(String(64))
    value: Mapped[Decimal] = mapped_column(Numeric(14, 4))
    description: Mapped[str] = mapped_column(String(255), default="")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("marketplace", "key", name="uq_tariff_marketplace_key"),
    )


class TaxRate(Base):
    __tablename__ = "tax_rates"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True)
    name: Mapped[str] = mapped_column(String(128))
    rate_percent: Mapped[Decimal] = mapped_column(Numeric(6, 3))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


# ============================================================
# НОВОЕ: пользователи, подписки, тарифы, usage
# ============================================================

class User(Base):
    """Пользователь сервиса."""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255), default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    subscription: Mapped["Subscription"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    usage_events: Mapped[list["UsageEvent"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Plan(Base):
    """Справочник тарифных планов."""
    __tablename__ = "plans"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True)   # free, pro, business
    name: Mapped[str] = mapped_column(String(128))
    price_monthly: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    # Лимиты в JSON: {"calculations_per_month": 10, "marketplaces": ["wb_fbo"], "export_excel": false}
    limits: Mapped[dict] = mapped_column(JSONB, default=dict)
    description: Mapped[str] = mapped_column(String(500), default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class Subscription(Base):
    """Активная подписка пользователя. У одного юзера — одна."""
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    plan_id: Mapped[int] = mapped_column(ForeignKey("plans.id"))
    status: Mapped[str] = mapped_column(String(32), default="active")  # active, expired, cancelled
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    source: Mapped[str] = mapped_column(String(32), default="free")  # free, payment, promo

    user: Mapped[User] = relationship(back_populates="subscription")
    plan: Mapped[Plan] = relationship()


class UsageEvent(Base):
    """Событие использования (расчёт) — для подсчёта лимитов."""
    __tablename__ = "usage_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    event_type: Mapped[str] = mapped_column(String(32))  # calculation, export, api_call
    marketplace: Mapped[str] = mapped_column(String(32), default="")
    meta: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    user: Mapped[User] = relationship(back_populates="usage_events")


class Payment(Base):
    """Заготовка под будущие платежи (ЮKassa и т.п.)."""
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    plan_id: Mapped[int] = mapped_column(ForeignKey("plans.id"))
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    currency: Mapped[str] = mapped_column(String(8), default="RUB")
    status: Mapped[str] = mapped_column(String(32), default="pending")  # pending, paid, failed, refunded
    external_id: Mapped[str] = mapped_column(String(128), default="")  # ID от платёжной системы
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ============================================================
# Дашборд: товары, продажи по дням, история импортов
# ============================================================

class Product(Base):
    """Товар пользователя."""
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    sku: Mapped[str] = mapped_column(String(128), index=True)
    name: Mapped[str] = mapped_column(String(500), default="")
    marketplace: Mapped[str] = mapped_column(String(32), default="")  # wb, ozon, yandex
    cost_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint("user_id", "sku", "marketplace", name="uq_product_user_sku_mp"),
    )

    sales: Mapped[list["SalesDaily"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )


class SalesDaily(Base):
    """Факт продаж товара за один день."""
    __tablename__ = "sales_daily"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), index=True
    )
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)

    # Ключевые цифры за день
    revenue: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))
    orders: Mapped[int] = mapped_column(Integer, default=0)

    # Расходы
    commission: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))
    logistics: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))
    storage: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))
    ads: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))
    tax: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))
    cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))

    # Рассчитанная прибыль (можно пересчитать в любой момент)
    profit: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    product: Mapped[Product] = relationship(back_populates="sales")


class ImportLog(Base):
    """История загрузок Excel (для будущего импорта)."""
    __tablename__ = "imports"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    filename: Mapped[str] = mapped_column(String(255), default="")
    marketplace: Mapped[str] = mapped_column(String(32), default="")
    rows_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(32), default="pending")
    error: Mapped[str] = mapped_column(String(500), default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
