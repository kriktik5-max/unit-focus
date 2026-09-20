"""Схемы входа/выхода калькулятора Wildberries FBO."""
from decimal import Decimal

from pydantic import BaseModel, Field

from app.domains.common.tax import TaxMode


class WbFboInput(BaseModel):
    name: str = Field(default="Товар", max_length=200)

    cost_price: Decimal = Field(gt=0, description="Себестоимость за единицу, руб")
    packaging_cost: Decimal = Field(default=Decimal("0"), ge=0)
    selling_price: Decimal = Field(gt=0, description="Цена продажи, руб")
    quantity: int = Field(default=1, ge=1)

    commission_percent: Decimal = Field(ge=0, le=100, description="Комиссия WB, %")
    logistics_cost: Decimal = Field(ge=0, description="Логистика WB за единицу, руб")
    storage_cost: Decimal = Field(default=Decimal("0"), ge=0)
    acquiring_percent: Decimal = Field(default=Decimal("0"), ge=0, le=100)

    ads_cost: Decimal = Field(default=Decimal("0"), ge=0)
    return_rate_percent: Decimal = Field(default=Decimal("0"), ge=0, le=100)

    tax_mode: TaxMode = TaxMode.USN_6
    vat_rate: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        le=100,
        description="Ставка НДС, %. Доступные значения зависят от налогового режима.",
    )


class WbFboOutput(BaseModel):
    revenue: Decimal
    commission: Decimal
    acquiring: Decimal
    logistics: Decimal
    storage: Decimal
    ads: Decimal
    cost_price: Decimal
    packaging: Decimal
    returns_loss: Decimal

    # Налоги
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
