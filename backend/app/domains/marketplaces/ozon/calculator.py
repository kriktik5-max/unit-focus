"""Калькулятор юнит-экономики Ozon FBO."""
from decimal import Decimal

from app.domains.common.money import d, money, percent, ZERO
from app.domains.common.tax import TaxMode, calculate_tax
from app.domains.marketplaces.base import MarketplaceCalculator
from app.domains.marketplaces.ozon.schemas import OzonFboInput, OzonFboOutput


class OzonFboCalculator(MarketplaceCalculator):
    marketplace_code = "ozon_fbo"

    def calculate(self, payload: OzonFboInput) -> OzonFboOutput:
        p = payload

        # 1. Выручка
        revenue = p.selling_price

        # 2. Комиссия Ozon
        commission = revenue * p.commission_percent / d(100)

        # 3. Эквайринг Ozon Pay
        acquiring = revenue * p.acquiring_percent / d(100)

        # 4. Логистика FBO: базовый тариф + надбавка за литры
        logistics = p.logistics_base + p.logistics_per_liter * p.volume_liters

        # 5. Последняя миля: процент от цены, но не более лимита
        last_mile_raw = revenue * p.last_mile_percent / d(100)
        last_mile = min(last_mile_raw, p.last_mile_max)

        # 6. Хранение (опционально)
        storage = p.storage_cost

        # 7. Реклама
        ads = p.ads_cost

        # 8. Себестоимость и упаковка
        cost = p.cost_price + p.packaging_cost

        # 9. Возвраты: доля выручки + фикс утилизации
        returns_loss = revenue * p.return_rate_percent / d(100) + p.return_utilization_cost

        # 10. Прибыль до налога
        profit_before_tax = (
            revenue
            - commission
            - acquiring
            - logistics
            - last_mile
            - storage
            - ads
            - cost
            - returns_loss
        )

        # 11. Налог
        tax = calculate_tax(p.tax_mode, revenue, profit_before_tax)
        profit = profit_before_tax - tax

        # 12. Метрики
        margin = (profit / revenue * d(100)) if revenue > ZERO else ZERO
        investment = p.cost_price + p.packaging_cost
        roi = (profit / investment * d(100)) if investment > ZERO else ZERO

        # 13. Точка безубыточности (упрощённая)
        variable_share = (
            p.commission_percent + p.acquiring_percent + p.return_rate_percent
        ) / d(100)
        fixed_costs = logistics + storage + ads + cost + p.return_utilization_cost
        if p.tax_mode in (TaxMode.USN_6, TaxMode.SELF_EMPLOYED):
            variable_share += d("0.06")

        break_even = fixed_costs / (d(1) - variable_share) if variable_share < d(1) else ZERO

        max_discount = (
            (p.selling_price - break_even) / p.selling_price * d(100)
            if p.selling_price > ZERO else ZERO
        )

        return OzonFboOutput(
            revenue=money(revenue),
            commission=money(commission),
            acquiring=money(acquiring),
            logistics=money(logistics),
            last_mile=money(last_mile),
            storage=money(storage),
            ads=money(ads),
            cost_price=money(p.cost_price),
            packaging=money(p.packaging_cost),
            returns_loss=money(returns_loss),
            tax=money(tax),
            profit_per_unit=money(profit),
            margin_percent=percent(margin),
            roi_percent=percent(roi),
            profit_total=money(profit * p.quantity),
            break_even_price=money(break_even),
            max_discount_percent=percent(max(max_discount, ZERO)),
        )
