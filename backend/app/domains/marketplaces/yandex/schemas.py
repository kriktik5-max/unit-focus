"""Схемы входа/выхода калькулятора Яндекс Маркет FBY."""
from decimal import Decimal

from pydantic import BaseModel, Field

from app.domains.common.tax import TaxMode


class YandexFbyInput(BaseModel):
    name: str = Field(default="Товар", max_length=200)

    cost_price: Decimal = Field(gt=0, description="Себестоимость за единицу, руб")
    packaging_cost: Decimal = Field(default=Decimal("0"), ge=0)
    selling_price: Decimal = Field(gt=0, description="Цена продажи, руб")
    quantity: int = Field(default=1, ge=1)

    # Комиссия (зависит от категории; есть 42% для товаров до 300 ₽, 9% по подписке)
    commission_percent: Decimal = Field(ge=0, le=100, description="Комиссия Яндекс Маркет, %")

    # Логистика (средняя миля): 80 ₽ за 1-й литр + 9 ₽ за каждый следующий
    logistics_first_liter: Decimal = Field(default=Decimal("80"), ge=0)
    logistics_per_additional_liter: Decimal = Field(default=Decimal("9"), ge=0)
    logistics_max: Decimal = Field(default=Decimal("5500"), ge=0, description="Максимум логистики, руб")
    volume_liters: Decimal = Field(default=Decimal("1"), gt=0, description="Объём товара, л")

    # Доставка покупателю: 5% от цены, не более 1000 ₽
    delivery_percent: Decimal = Field(default=Decimal("5"), ge=0, le=100)
    delivery_max: Decimal = Field(default=Decimal("1000"), ge=0)

    # Обработка заказа
    order_processing: Decimal = Field(default=Decimal("25"), ge=0, description="Обработка заказа, руб")

    # Хранение (сейчас акция до 90% скидки)
    storage_cost: Decimal = Field(default=Decimal("0"), ge=0)

    # Эквайринг (обычно включён в комиссию, но оставим опционально)
    acquiring_percent: Decimal = Field(default=Decimal("0"), ge=0, le=100)

    # Реклама
    ads_cost: Decimal = Field(default=Decimal("0"), ge=0)

    # Возвраты
    return_rate_percent: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    return_utilization_cost: Decimal = Field(default=Decimal("0"), ge=0)

    # Налог
    tax_mode: TaxMode = TaxMode.USN_6


class YandexFbyOutput(BaseModel):
    revenue: Decimal
    commission: Decimal
    acquiring: Decimal
    logistics: Decimal
    delivery: Decimal
    order_processing: Decimal
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
