"""Калькулятор юнит-экономики Яндекс Маркет FBY. Точка безубыточности — бинарный поиск."""
from decimal import Decimal

from app.domains.common.money import d, money, percent, ZERO
from app.domains.common.tax import calculate_income_tax, calculate_vat
from app.domains.marketplaces.base import MarketplaceCalculator
from app.domains.marketplaces.yandex.schemas import YandexFbyInput, YandexFbyOutput


class YandexFbyCalculator(MarketplaceCalculator):
    marketplace_code = "yandex_fby"

    def _logistics(self, p: YandexFbyInput) -> Decimal:
        if p.volume_liters <= d(1):
            raw = p.logistics_first_liter
        else:
            raw = p.logistics_first_liter + p.logistics_per_additional_liter * (p.volume_liters - d(1))
        return min(raw, p.logistics_max)

    def _delivery(self, revenue: Decimal, p: YandexFbyInput) -> Decimal:
        return min(revenue * p.delivery_percent / d(100), p.delivery_max)

    def _profit_at_price(self, p: YandexFbyInput, selling_price: Decimal) -> Decimal:
        revenue = selling_price
        commission = revenue * p.commission_percent / d(100)
        acquiring = revenue * p.acquiring_percent / d(100)
        logistics = self._logistics(p)
        delivery = self._delivery(revenue, p)
        returns_loss = revenue * p.return_rate_percent / d(100) + p.return_utilization_cost
        cost = p.cost_price + p.packaging_cost

        deductible = (
            p.cost_price + p.packaging_cost + commission
            + logistics + delivery + p.order_processing + p.storage_cost + p.ads_cost
        )
        vat_out, _, vat_payable = calculate_vat(
            mode=p.tax_mode, vat_rate=p.vat_rate,
            revenue=revenue, deductible_expenses=deductible,
        )
        profit_before_tax = (
            revenue - commission - acquiring - logistics - delivery
            - p.order_processing - p.storage_cost - p.ads_cost - cost - returns_loss - vat_payable
        )
        income_tax = calculate_income_tax(
            mode=p.tax_mode, revenue=revenue,
            vat_output=vat_out,
            profit_before_income_tax=profit_before_tax,
        )
        return profit_before_tax - income_tax

    def _find_break_even(self, p: YandexFbyInput) -> Decimal:
        lo = d("0.01")
        hi = max(p.selling_price * d(10), d(100000))
        if self._profit_at_price(p, hi) < ZERO:
            return ZERO
        for _ in range(60):
            mid = (lo + hi) / d(2)
            if self._profit_at_price(p, mid) > ZERO:
                hi = mid
            else:
                lo = mid
        return (lo + hi) / d(2)

    def calculate(self, payload: YandexFbyInput) -> YandexFbyOutput:
        p = payload
        revenue = p.selling_price
        commission = revenue * p.commission_percent / d(100)
        acquiring = revenue * p.acquiring_percent / d(100)
        logistics = self._logistics(p)
        delivery = self._delivery(revenue, p)
        returns_loss = revenue * p.return_rate_percent / d(100) + p.return_utilization_cost
        cost = p.cost_price + p.packaging_cost

        deductible = (
            p.cost_price + p.packaging_cost + commission
            + logistics + delivery + p.order_processing + p.storage_cost + p.ads_cost
        )
        vat_out, vat_ded, vat_payable = calculate_vat(
            mode=p.tax_mode, vat_rate=p.vat_rate,
            revenue=revenue, deductible_expenses=deductible,
        )
        profit_before_tax = (
            revenue - commission - acquiring - logistics - delivery
            - p.order_processing - p.storage_cost - p.ads_cost - cost - returns_loss - vat_payable
        )
        income_tax = calculate_income_tax(
            mode=p.tax_mode, revenue=revenue,
            vat_output=vat_out,
            profit_before_income_tax=profit_before_tax,
        )
        total_tax = vat_payable + income_tax
        profit = profit_before_tax - income_tax

        margin = (profit / revenue * d(100)) if revenue > ZERO else ZERO
        investment = p.cost_price + p.packaging_cost
        roi = (profit / investment * d(100)) if investment > ZERO else ZERO

        break_even = self._find_break_even(p)
        if p.selling_price > ZERO and break_even > ZERO:
            max_discount = (p.selling_price - break_even) / p.selling_price * d(100)
            max_discount = max(max_discount, ZERO)
        else:
            max_discount = ZERO

        return YandexFbyOutput(
            revenue=money(revenue),
            commission=money(commission),
            acquiring=money(acquiring),
            logistics=money(logistics),
            delivery=money(delivery),
            order_processing=money(p.order_processing),
            storage=money(p.storage_cost),
            ads=money(p.ads_cost),
            cost_price=money(p.cost_price),
            packaging=money(p.packaging_cost),
            returns_loss=money(returns_loss),
            vat_output=money(vat_out),
            vat_deductible=money(vat_ded),
            vat_payable=money(vat_payable),
            income_tax=money(income_tax),
            total_tax=money(total_tax),
            profit_per_unit=money(profit),
            margin_percent=percent(margin),
            roi_percent=percent(roi),
            profit_total=money(profit * p.quantity),
            break_even_price=money(break_even),
            max_discount_percent=percent(max_discount),
        )
