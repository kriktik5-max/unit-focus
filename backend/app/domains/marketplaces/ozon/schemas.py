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

    commission_percent: Decimal = Field(ge=0, le=100, description="Комиссия Ozon, %")
    logistics_base: Decimal = Field(default=Decimal("46.77"), ge=0)
    logistics_per_liter: Decimal = Field(default=Decimal("10.17"), ge=0)
    volume_liters: Decimal = Field(default=Decimal("1"), gt=0)
    last_mile_percent: Decimal = Field(default=Decimal("5.5"), ge=0, le=100)
    last_mile_max: Decimal = Field(default=Decimal("500"), ge=0)
    acquiring_percent: Decimal = Field(default=Decimal("2.2"), ge=0, le=100)
    storage_cost: Decimal = Field(default=Decimal("0"), ge=0)
    ads_cost: Decimal = Field(default=Decimal("0"), ge=0)
    return_rate_percent: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    return_utilization_cost: Decimal = Field(default=Decimal("0"), ge=0)

    tax_mode: TaxMode = TaxMode.USN_6
    vat_rate: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        le=100,
        description="Ставка НДС, %. Доступные значения зависят от налогового режима.",
    )


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
