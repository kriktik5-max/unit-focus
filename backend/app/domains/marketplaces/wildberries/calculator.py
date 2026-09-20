"""Калькулятор юнит-экономики Wildberries FBO."""
from decimal import Decimal

from app.domains.common.money import d, money, percent, ZERO
from app.domains.common.tax import TaxMode, calculate_tax
from app.domains.marketplaces.base import MarketplaceCalculator
from app.domains.marketplaces.wildberries.schemas import WbFboInput, WbFboOutput


class WbFboCalculator(MarketplaceCalculator):
    marketplace_code = "wb_fbo"

    def calculate(self, payload: WbFboInput) -> WbFboOutput:
        p = payload

        revenue = p.selling_price
        commission = revenue * p.commission_percent / d(100)
        acquiring = revenue * p.acquiring_percent / d(100)
        logistics = p.logistics_cost
        storage = p.storage_cost
        ads = p.ads_cost
        cost = p.cost_price + p.packaging_cost
        returns_loss = revenue * p.return_rate_percent / d(100)

        profit_before_tax = (
            revenue - commission - acquiring - logistics
            - storage - ads - cost - returns_loss
        )

        tax = calculate_tax(p.tax_mode, revenue, profit_before_tax)
        profit = profit_before_tax - tax

        margin = (profit / revenue * d(100)) if revenue > ZERO else ZERO
        investment = p.cost_price + p.packaging_cost
        roi = (profit / investment * d(100)) if investment > ZERO else ZERO

        variable_share = (
            p.commission_percent + p.acquiring_percent + p.return_rate_percent
        ) / d(100)
        fixed_costs = logistics + storage + ads + cost
        if p.tax_mode in (TaxMode.USN_6, TaxMode.SELF_EMPLOYED):
            variable_share += d("0.06")

        break_even = fixed_costs / (d(1) - variable_share) if variable_share < d(1) else ZERO

        max_discount = (
            (p.selling_price - break_even) / p.selling_price * d(100)
            if p.selling_price > ZERO else ZERO
        )

        return WbFboOutput(
            revenue=money(revenue),
            commission=money(commission),
            acquiring=money(acquiring),
            logistics=money(logistics),
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
