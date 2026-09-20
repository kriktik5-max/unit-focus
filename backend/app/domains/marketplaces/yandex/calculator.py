"""Калькулятор юнит-экономики Яндекс Маркет FBY."""
from decimal import Decimal

from app.domains.common.money import d, money, percent, ZERO
from app.domains.common.tax import (
    TaxMode,
    calculate_income_tax,
    calculate_vat,
)
from app.domains.marketplaces.base import MarketplaceCalculator
from app.domains.marketplaces.yandex.schemas import YandexFbyInput, YandexFbyOutput


class YandexFbyCalculator(MarketplaceCalculator):
    marketplace_code = "yandex_fby"

    def calculate(self, payload: YandexFbyInput) -> YandexFbyOutput:
        p = payload

        revenue = p.selling_price
        commission = revenue * p.commission_percent / d(100)
        acquiring = revenue * p.acquiring_percent / d(100)

        # Логистика: 1-й литр по базовой, остальные — по надбавке
        if p.volume_liters <= d(1):
            logistics_raw = p.logistics_first_liter
        else:
            extra = p.volume_liters - d(1)
            logistics_raw = p.logistics_first_liter + p.logistics_per_additional_liter * extra
        logistics = min(logistics_raw, p.logistics_max)

        # Доставка покупателю: % от цены, но не больше лимита
        delivery_raw = revenue * p.delivery_percent / d(100)
        delivery = min(delivery_raw, p.delivery_max)

        order_processing = p.order_processing
        storage = p.storage_cost
        ads = p.ads_cost
        cost = p.cost_price + p.packaging_cost
        returns_loss = revenue * p.return_rate_percent / d(100) + p.return_utilization_cost

        # Расходы с входящим НДС
        deductible_expenses = (
            p.cost_price
            + p.packaging_cost
            + commission
            + logistics
            + delivery
            + order_processing
            + storage
            + ads
        )

        # НДС
        vat_output, vat_deductible, vat_payable = calculate_vat(
            mode=p.tax_mode,
            vat_rate=p.vat_rate,
            revenue=revenue,
            deductible_expenses=deductible_expenses,
        )

        # Прибыль до налога на прибыль
        profit_before_income_tax = (
            revenue
            - commission
            - acquiring
            - logistics
            - delivery
            - order_processing
            - storage
            - ads
            - cost
            - returns_loss
            - vat_payable
        )

        income_tax = calculate_income_tax(
            mode=p.tax_mode,
            revenue=revenue,
            vat_output=vat_output,
            profit_before_income_tax=profit_before_income_tax,
        )

        total_tax = vat_payable + income_tax
        profit = profit_before_income_tax - income_tax

        margin = (profit / revenue * d(100)) if revenue > ZERO else ZERO
        investment = p.cost_price + p.packaging_cost
        roi = (profit / investment * d(100)) if investment > ZERO else ZERO

        # Точка безубыточности (упрощённо)
        variable_share = (
            p.commission_percent + p.delivery_percent + p.acquiring_percent + p.return_rate_percent
        ) / d(100)
        if p.tax_mode in (TaxMode.USN_6, TaxMode.SELF_EMPLOYED):
            variable_share += d("0.06")

        fixed_costs = (
            logistics + order_processing + storage + ads + cost + p.return_utilization_cost
        )
        break_even = fixed_costs / (d(1) - variable_share) if variable_share < d(1) else ZERO

        max_discount = (
            (p.selling_price - break_even) / p.selling_price * d(100)
            if p.selling_price > ZERO else ZERO
        )

        return YandexFbyOutput(
            revenue=money(revenue),
            commission=money(commission),
            acquiring=money(acquiring),
            logistics=money(logistics),
            delivery=money(delivery),
            order_processing=money(order_processing),
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
