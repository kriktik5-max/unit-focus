"""Калькулятор юнит-экономики Яндекс Маркет FBY."""
from decimal import Decimal

from app.domains.common.money import d, money, percent, ZERO
from app.domains.common.tax import TaxMode, calculate_tax
from app.domains.marketplaces.base import MarketplaceCalculator
from app.domains.marketplaces.yandex.schemas import YandexFbyInput, YandexFbyOutput


class YandexFbyCalculator(MarketplaceCalculator):
    marketplace_code = "yandex_fby"

    def calculate(self, payload: YandexFbyInput) -> YandexFbyOutput:
        p = payload

        # 1. Выручка
        revenue = p.selling_price

        # 2. Комиссия Яндекс Маркет
        commission = revenue * p.commission_percent / d(100)

        # 3. Эквайринг (опционально)
        acquiring = revenue * p.acquiring_percent / d(100)

        # 4. Логистика: 1-й литр по базовой, остальные — по надбавке
        if p.volume_liters <= d(1):
            logistics_raw = p.logistics_first_liter
        else:
            extra_liters = p.volume_liters - d(1)
            logistics_raw = p.logistics_first_liter + p.logistics_per_additional_liter * extra_liters
        logistics = min(logistics_raw, p.logistics_max)

        # 5. Доставка покупателю: процент от цены, не более лимита
        delivery_raw = revenue * p.delivery_percent / d(100)
        delivery = min(delivery_raw, p.delivery_max)

        # 6. Обработка заказа
        order_processing = p.order_processing

        # 7. Хранение
        storage = p.storage_cost

        # 8. Реклама
        ads = p.ads_cost

        # 9. Себестоимость и упаковка
        cost = p.cost_price + p.packaging_cost

        # 10. Возвраты
        returns_loss = revenue * p.return_rate_percent / d(100) + p.return_utilization_cost

        # 11. Прибыль до налога
        profit_before_tax = (
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
        )

        # 12. Налог
        tax = calculate_tax(p.tax_mode, revenue, profit_before_tax)
        profit = profit_before_tax - tax

        # 13. Метрики
        margin = (profit / revenue * d(100)) if revenue > ZERO else ZERO
        investment = p.cost_price + p.packaging_cost
        roi = (profit / investment * d(100)) if investment > ZERO else ZERO

        # 14. Точка безубыточности
        # Переменные: комиссия + доставка покупателю + эквайринг + возвраты + налог УСН
        variable_share = (
            p.commission_percent + p.delivery_percent + p.acquiring_percent + p.return_rate_percent
        ) / d(100)
        if p.tax_mode in (TaxMode.USN_6, TaxMode.SELF_EMPLOYED):
            variable_share += d("0.06")

        fixed_costs = logistics + order_processing + storage + ads + cost + p.return_utilization_cost
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
            tax=money(tax),
            profit_per_unit=money(profit),
            margin_percent=percent(margin),
            roi_percent=percent(roi),
            profit_total=money(profit * p.quantity),
            break_even_price=money(break_even),
            max_discount_percent=percent(max(max_discount, ZERO)),
        )
