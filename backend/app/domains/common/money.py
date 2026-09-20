"""Работа с деньгами. Всё в Decimal, никогда во float."""
from decimal import Decimal, ROUND_HALF_UP


def d(value) -> Decimal:
    """Безопасная конвертация в Decimal."""
    if isinstance(value, Decimal):
        return value
    if isinstance(value, float):
        return Decimal(str(value))
    return Decimal(value)


def money(value: Decimal) -> Decimal:
    """Округление до копеек."""
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def percent(value: Decimal) -> Decimal:
    """Округление процентов до 2 знаков."""
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


ZERO = Decimal("0")
