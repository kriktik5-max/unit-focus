"""Налоговые режимы РФ."""
from decimal import Decimal
from enum import Enum

from .money import d, ZERO


class TaxMode(str, Enum):
    NONE = "none"
    SELF_EMPLOYED = "self_employed"
    USN_6 = "usn_6"
    USN_15 = "usn_15"
    OSNO = "osno"


def calculate_tax(mode: TaxMode, revenue: Decimal, profit_before_tax: Decimal) -> Decimal:
    if mode == TaxMode.NONE:
        return ZERO
    if mode in (TaxMode.SELF_EMPLOYED, TaxMode.USN_6):
        return revenue * d("0.06")
    if mode == TaxMode.USN_15:
        base = profit_before_tax if profit_before_tax > ZERO else ZERO
        return base * d("0.15")
    if mode == TaxMode.OSNO:
        return revenue * d("0.20")
    return ZERO
