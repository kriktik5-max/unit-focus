"""Калькулятор юнит-экономики Wildberries FBO."""
from decimal import Decimal

from app.domains.common.money import d, money, percent, ZERO
from app.domains.common.tax import (
    TaxMode,
    calculate_income_tax,
    calculate_vat,
)
from app.domains.marketplaces.base import MarketplaceCalculator
from app.domains.marketplaces.wildberries.schemas import WbFboInput, WbFboOutput


class WbFboCalculator(MarketplaceCalculator):
    marketplace_code = "wb_fbo"

    def calculate(self, payload: WbFboInput) -> WbFboOutput:
        p = payload

        # 1. Основные суммы
        revenue = p.selling_price
        commission = revenue * p.commission_percent / d(100)
        acquiring = revenue * p.acquiring_percent / d(100)
        logistics = p.logistics_cost
        storage = p.storage_cost
        ads = p.ads_cost
        cost = p.cost_price + p.packaging_cost
        returns_loss = revenue * p.return_rate_percent / d(100)

        # 2. Расходы, в которых «сидит» входной НДС (от поставщика и маркетплейса)
        deductible_expenses = (
            p.cost_price
            + p.packaging_cost
            + commission
            + logistics
            + storage
            + ads
        )

        # 3. НДС
        vat_output, vat_deductible, vat_payable = calculate_vat(
            mode=p.tax_mode,
            vat_rate=p.vat_rate,
            revenue=revenue,
            deductible_expenses=deductible_expenses,
        )

        # 4. Прибыль до налога на прибыль (НДС уже вычтен)
        profit_before_income_tax = (
            revenue
            - commission
            - acquiring
            - logistics
            - storage
            - ads
            - cost
            - returns_loss
            - vat_payable
        )

        # 5. Налог на прибыль / НПД / УСН
        income_tax = calculate_income_tax(
            mode=p.tax_mode,
            revenue=revenue,
            vat_output=vat_output,
            profit_before_income_tax=profit_before_income_tax,
        )

        total_tax = vat_payable + income_tax
        profit = profit_before_income_tax - income_tax

        # 6. Метрики
        margin = (profit / revenue * d(100)) if revenue > ZERO else ZERO
        investment = p.cost_price + p.packaging_cost
        roi = (profit / investment * d(100)) if investment > ZERO else ZERO

        # 7. Точка безубыточности (упрощённо: без НДС)
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
            vat_output=money(vat_output),
            vat_deductible=money(vat_deductible),
            vat_payable=money(vat_payable),
            income_tax=money(income_tax),
            total_tax=money(total_tax),
            profit_per_unit=money(profit),
            margin_percent=percent(margin),
            roi_percent=percent(roi),
            profit_total=money(profit * p.quantity),
            break_even_price=money(break_even),
            max_discount_percent=percent(max(max_discount, ZERO)),
        )
