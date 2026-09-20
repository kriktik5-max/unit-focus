"""Схемы входа/выхода калькулятора Яндекс Маркет FBY."""
from decimal import Decimal

from pydantic import BaseModel, Field

from app.domains.common.tax import TaxMode


class YandexFbyInput(BaseModel):
    name: str = Field(default="Товар", max_length=200)
    cost_price: Decimal = Field(gt=0)
    packaging_cost: Decimal = Field(default=Decimal("0"), ge=0)
    selling_price: Decimal = Field(gt=0)
    quantity: int = Field(default=1, ge=1)

    commission_percent: Decimal = Field(ge=0, le=100)
    logistics_first_liter: Decimal = Field(default=Decimal("80"), ge=0)
    logistics_per_additional_liter: Decimal = Field(default=Decimal("9"), ge=0)
    logistics_max: Decimal = Field(default=Decimal("5500"), ge=0)
    volume_liters: Decimal = Field(default=Decimal("1"), gt=0)
    delivery_percent: Decimal = Field(default=Decimal("5"), ge=0, le=100)
    delivery_max: Decimal = Field(default=Decimal("1000"), ge=0)
    order_processing: Decimal = Field(default=Decimal("25"), ge=0)
    storage_cost: Decimal = Field(default=Decimal("0"), ge=0)
    acquiring_percent: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    ads_cost: Decimal = Field(default=Decimal("0"), ge=0)
    return_rate_percent: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    return_utilization_cost: Decimal = Field(default=Decimal("0"), ge=0)

    tax_mode: TaxMode = TaxMode.USN_6
    vat_rate: Decimal = Field(default=Decimal("0"), ge=0, le=100)


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

    vat_output: Decimal
    vat_deductible: Decimal
    vat_payable: Decimal
    income_tax: Decimal
    total_tax: Decimal

    profit_per_unit: Decimal
    margin_percent: Decimal
    roi_percent: Decimal
    profit_total: Decimal
    break_even_price: Decimal
    max_discount_percent: Decimal
