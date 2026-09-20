"""Модели (таблицы) базы данных."""
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Numeric, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class TariffSetting(Base):
    """Настройка тарифа: одна строка = один параметр одного маркетплейса.

    Примеры:
      marketplace='wb_fbo',   key='commission_percent', value=20.0
      marketplace='ozon_fbo', key='last_mile_percent',  value=5.5
    """
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
    """Налоговая ставка."""
    __tablename__ = "tax_rates"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True)
    name: Mapped[str] = mapped_column(String(128))
    rate_percent: Mapped[Decimal] = mapped_column(Numeric(6, 3))
    is_active: Mapped[bool] = mapped_column(default=True)
