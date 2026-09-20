"""Калькулятор юнит-экономики Wildberries FBO. Точка безубыточности — бинарный поиск."""
from decimal import Decimal

from app.domains.common.money import d, money, percent, ZERO
from app.domains.common.tax import calculate_income_tax, calculate_vat
from app.domains.marketplaces.base import MarketplaceCalculator
from app.domains.marketplaces.wildberries.schemas import WbFboInput, WbFboOutput


class WbFboCalculator(MarketplaceCalculator):
    marketplace_code = "wb_fbo"

    # ---------- Внутренняя функция: прибыль при заданной цене ----------
    def _profit_at_price(self, p: WbFboInput, selling_price: Decimal) -> Decimal:
        """Считает чистую прибыль при произвольной цене продажи.

        Используется для бинарного поиска точки безубыточности.
        """
        # Применяем СПП: покупатель платит меньше, комиссия — от цены покупателя
        effective = selling_price * (d(100) - p.spp_percent) / d(100)

        revenue = effective
        commission = revenue * p.commission_percent / d(100)
        acquiring = revenue * p.acquiring_percent / d(100)
        returns_loss = revenue * p.return_rate_percent / d(100)

        cost = p.cost_price + p.packaging_cost
        fixed = p.logistics_cost + p.storage_cost + p.ads_cost

        deductible = (
            p.cost_price + p.packaging_cost + commission
            + p.logistics_cost + p.storage_cost + p.ads_cost
        )

        _, _, vat_payable = calculate_vat(
            mode=p.tax_mode, vat_rate=p.vat_rate,
            revenue=revenue, deductible_expenses=deductible,
        )

        profit_before_tax = (
            revenue - commission - acquiring - returns_loss - cost - fixed - vat_payable
        )

        income_tax = calculate_income_tax(
            mode=p.tax_mode, revenue=revenue,
            vat_output=calculate_vat(
                mode=p.tax_mode, vat_rate=p.vat_rate,
                revenue=revenue, deductible_expenses=deductible,
            )[0],
            profit_before_income_tax=profit_before_tax,
        )

        return profit_before_tax - income_tax

    # ---------- Бинарный поиск точки безубыточности ----------
    def _find_break_even(self, p: WbFboInput) -> Decimal:
        """Находит цену, при которой чистая прибыль = 0."""
        lo = d("0.01")
        hi = max(p.selling_price * d(10), d(100000))

        # Если даже при очень большой цене убыток — точки нет
        if self._profit_at_price(p, hi) < ZERO:
            return ZERO

        for _ in range(60):
            mid = (lo + hi) / d(2)
            if self._profit_at_price(p, mid) > ZERO:
                hi = mid
            else:
                lo = mid

        return (lo + hi) / d(2)

    # ---------- Основной расчёт ----------
    def calculate(self, payload: WbFboInput) -> WbFboOutput:
        p = payload

        # 1. Цена с СПП
        effective_price = p.selling_price * (d(100) - p.spp_percent) / d(100)
        revenue = effective_price

        # 2. Расходы
        commission = revenue * p.commission_percent / d(100)
        acquiring = revenue * p.acquiring_percent / d(100)
        returns_loss = revenue * p.return_rate_percent / d(100)
        cost = p.cost_price + p.packaging_cost

        # 3. НДС
        deductible = (
            p.cost_price + p.packaging_cost + commission
            + p.logistics_cost + p.storage_cost + p.ads_cost
        )
        vat_output, vat_deductible, vat_payable = calculate_vat(
            mode=p.tax_mode, vat_rate=p.vat_rate,
            revenue=revenue, deductible_expenses=deductible,
        )

        # 4. Прибыль до налога на прибыль
        profit_before_tax = (
            revenue - commission - acquiring - returns_loss
            - cost - p.logistics_cost - p.storage_cost - p.ads_cost - vat_payable
        )

        # 5. Налог на прибыль
        income_tax = calculate_income_tax(
            mode=p.tax_mode, revenue=revenue,
            vat_output=vat_output,
            profit_before_income_tax=profit_before_tax,
        )
        total_tax = vat_payable + income_tax
        profit = profit_before_tax - income_tax

        # 6. Метрики
        margin = (profit / revenue * d(100)) if revenue > ZERO else ZERO
        investment = p.cost_price + p.packaging_cost
        roi = (profit / investment * d(100)) if investment > ZERO else ZERO

        # 7. Точка безубыточности — бинарный поиск
        break_even = self._find_break_even(p)

        # 8. Максимальная скидка от ТЕКУЩЕЙ цены до точки безубыточности
        if p.selling_price > ZERO and break_even > ZERO:
            max_discount = (p.selling_price - break_even) / p.selling_price * d(100)
            max_discount = max(max_discount, ZERO)
        else:
            max_discount = ZERO

        return WbFboOutput(
            selling_price=money(p.selling_price),
            effective_price=money(effective_price),
            revenue=money(revenue),
            commission=money(commission),
            acquiring=money(acquiring),
            logistics=money(p.logistics_cost),
            storage=money(p.storage_cost),
            ads=money(p.ads_cost),
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
            max_discount_percent=percent(max_discount),
        )
