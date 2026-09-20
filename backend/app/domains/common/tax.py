"""Налоговые режимы РФ и расчёт налогов с учётом НДС."""
from decimal import Decimal
from enum import Enum

from .money import d, ZERO


class TaxMode(str, Enum):
    NONE = "none"
    SELF_EMPLOYED = "self_employed"
    USN_6 = "usn_6"
    USN_15 = "usn_15"
    OSNO = "osno"


# Какие ставки НДС доступны для каждого режима
VAT_RATES_BY_MODE: dict[TaxMode, list[int]] = {
    TaxMode.NONE: [0],
    TaxMode.SELF_EMPLOYED: [0],
    TaxMode.USN_6: [0, 5, 7, 22],
    TaxMode.USN_15: [0, 5, 7, 22],
    TaxMode.OSNO: [0, 10, 22],
}

# При каких ставках доступен вычет входящего НДС
DEDUCTIBLE_VAT_RATES = {10, 22}


def vat_deductible_allowed(mode: TaxMode, vat_rate: Decimal) -> bool:
    """Можно ли принимать входящий НДС к вычету при данном режиме и ставке."""
    rate_int = int(vat_rate)
    if mode in (TaxMode.NONE, TaxMode.SELF_EMPLOYED):
        return False
    if rate_int not in DEDUCTIBLE_VAT_RATES:
        return False
    # Для УСН вычет доступен только при ставке 22%
    if mode in (TaxMode.USN_6, TaxMode.USN_15) and rate_int != 22:
        return False
    # Для ОСНО — при 10% и 22%
    if mode == TaxMode.OSNO and rate_int in (10, 22):
        return True
    return False


def extract_vat(gross: Decimal, vat_rate: Decimal) -> Decimal:
    """Выделяет НДС из суммы, в которой он уже включён.
    Пример: 1000 ₽ при 22% → 1000 * 22 / 122 = 180.33 ₽
    """
    if vat_rate <= ZERO:
        return ZERO
    return gross * vat_rate / (d(100) + vat_rate)


def calculate_vat(
    mode: TaxMode,
    vat_rate: Decimal,
    revenue: Decimal,
    deductible_expenses: Decimal,
) -> tuple[Decimal, Decimal, Decimal]:
    """Считает НДС.

    Возвращает кортеж (начисленный, к_вычету, к_уплате).
    """
    if vat_rate <= ZERO:
        return ZERO, ZERO, ZERO

    vat_output = extract_vat(revenue, vat_rate)

    if vat_deductible_allowed(mode, vat_rate):
        vat_deductible = extract_vat(deductible_expenses, vat_rate)
    else:
        vat_deductible = ZERO

    vat_payable = vat_output - vat_deductible
    if vat_payable < ZERO:
        vat_payable = ZERO

    return vat_output, vat_deductible, vat_payable


def calculate_income_tax(
    mode: TaxMode,
    revenue: Decimal,
    vat_output: Decimal,
    profit_before_income_tax: Decimal,
) -> Decimal:
    """Считает налог на прибыль / НПД / УСН."""
    if mode == TaxMode.NONE:
        return ZERO

    if mode == TaxMode.SELF_EMPLOYED:
        # НПД 6% с выручки (без НДС, у самозанятых его нет)
        return revenue * d("0.06")

    if mode == TaxMode.USN_6:
        # 6% с выручки, очищенной от НДС
        base = revenue - vat_output
        return base * d("0.06")

    if mode == TaxMode.USN_15:
        # 15% с прибыли (если в плюсе)
        base = profit_before_income_tax if profit_before_income_tax > ZERO else ZERO
        return base * d("0.15")

    if mode == TaxMode.OSNO:
        # 25% с прибыли (с 2025 года)
        base = profit_before_income_tax if profit_before_income_tax > ZERO else ZERO
        return base * d("0.25")

    return ZERO
