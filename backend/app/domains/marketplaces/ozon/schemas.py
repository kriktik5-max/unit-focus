"""Схемы входа/выхода калькулятора Ozon FBO."""
from decimal import Decimal

from pydantic import BaseModel, Field

from app.domains.common.tax import TaxMode


class OzonFboInput(BaseModel):
    name: str = Field(default="Товар", max_length=200)

    cost_price: Decimal = Field(gt=0, description="Себестоимость за единицу, руб")
    packaging_cost: Decimal = Field(default=Decimal("0"), ge=0)
    selling_price: Decimal = Field(gt=0, description="Цена продажи, руб")
    quantity: int = Field(default=1, ge=1)

    # Ozon-специфика
    commission_percent: Decimal = Field(ge=0, le=100, description="Комиссия Ozon, %")

    # Логистика FBO: базовый тариф (обычно для товаров до 1 л) + надбавка
    logistics_base: Decimal = Field(default=Decimal("46.77"), ge=0, description="Логистика: базовый тариф, руб")
    logistics_per_liter: Decimal = Field(default=Decimal("10.17"), ge=0, description="Логистика: надбавка за литр, руб")
    volume_liters: Decimal = Field(default=Decimal("1"), gt=0, description="Объём товара, л")

    # Последняя миля: 5.5% от цены, но не более 500 руб
    last_mile_percent: Decimal = Field(default=Decimal("5.5"), ge=0, le=100)
    last_mile_max: Decimal = Field(default=Decimal("500"), ge=0, description="Максимум последней мили, руб")

    # Эквайринг Ozon Pay
    acquiring_percent: Decimal = Field(default=Decimal("2.2"), ge=0, le=100)

    # Хранение (опционально — обычно первые 120 дней бесплатно)
    storage_cost: Decimal = Field(default=Decimal("0"), ge=0)

    # Возвраты: утилизация + доля
    return_rate_percent: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    return_utilization_cost: Decimal = Field(default=Decimal("0"), ge=0, description="Утилизация возврата, руб")

    # Реклама
    ads_cost: Decimal = Field(default=Decimal("0"), ge=0)

    # Налог
    tax_mode: TaxMode = TaxMode.USN_6


class OzonFboOutput(BaseModel):
    revenue: Decimal
    commission: Decimal
    acquiring: Decimal
    logistics: Decimal
    last_mile: Decimal
    storage: Decimal
    ads: Decimal
    cost_price: Decimal
    packaging: Decimal
    returns_loss: Decimal
    tax: Decimal

    profit_per_unit: Decimal
    margin_percent: Decimal
    roi_percent: Decimal
    profit_total: Decimal
    break_even_price: Decimal
    max_discount_percent: Decimal
