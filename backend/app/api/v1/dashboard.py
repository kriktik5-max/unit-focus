"""API дашборда: KPI (EBITDA, налоги, чистая прибыль), график, таблица товаров."""
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db import get_db
from app.domains.common.money import d, ZERO
from app.domains.common.tax import (
    TaxMode,
    calculate_income_tax,
)
from app.models import Product, SalesDaily, User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


# ============================================================
# Схемы ответа
# ============================================================

class KpiOut(BaseModel):
    revenue: float             # Выручка с НДС
    revenue_net: float         # Выручка без НДС (знаменатель для маржинальности)
    ebitda: float              # Выручка − все расходы МП и себестоимость (без налогов)
    tax_total: float           # НДС + налог по режиму
    vat: float                 # Только исходящий НДС
    income_tax: float          # Только налог по режиму (УСН/НПД/ОСНО)
    net_profit: float          # EBITDA − Налоги
    orders: int
    margin_percent: float      # Чистая прибыль / Выручка без НДС × 100


class DailyPoint(BaseModel):
    date: str
    revenue: float
    ebitda: float
    net_profit: float
    # Разбивка по МП — упрощённо, без пересчёта налогов (EBITDA минус средний налог)
    revenue_wb: float = 0
    revenue_ozon: float = 0
    revenue_yandex: float = 0
    ebitda_wb: float = 0
    ebitda_ozon: float = 0
    ebitda_yandex: float = 0


class SummaryResponse(BaseModel):
    kpi: KpiOut
    daily: list[DailyPoint]
    period_days: int
    marketplace: str
    tax_mode: str
    vat_rate: float


class ProductRow(BaseModel):
    product_id: int
    sku: str
    name: str
    marketplace: str
    revenue: float
    ebitda: float
    orders: int
    margin_percent: float


class ProductsResponse(BaseModel):
    products: list[ProductRow]
    period_days: int


# ============================================================
# Внутренняя утилита: считает налоги для агрегата
# ============================================================

def _calc_taxes(
    tax_mode: str,
    vat_rate: float,
    revenue: float,
    deductible_expenses: float,  # не используется — оставлено для совместимости
    ebitda: float,
) -> tuple[float, float, float]:
    """Возвращает (vat_total, income_tax, net_profit).

    УПРОЩЁННАЯ МОДЕЛЬ: НДС считается как процент от выручки,
    БЕЗ вычета входящего НДС. Это ближе к реальности селлера,
    который не знает точно, кто из поставщиков платит НДС.

    - vat_total: НДС к уплате = Выручка × ставка / (100 + ставка)
    - income_tax: налог по режиму
    - net_profit: EBITDA − vat_total − income_tax
    """
    try:
        mode = TaxMode(tax_mode)
    except ValueError:
        mode = TaxMode.USN_6

    vat_r = d(str(vat_rate))
    rev = d(str(revenue))
    eb = d(str(ebitda))

    # НДС как доля в цене (без вычета)
    if vat_r > ZERO:
        vat_payable = rev * vat_r / (d("100") + vat_r)
    else:
        vat_payable = ZERO
    vat_out = vat_payable

    profit_before_income_tax = eb - vat_payable
    income_tax = calculate_income_tax(
        mode=mode, revenue=rev, vat_output=vat_out,
        profit_before_income_tax=profit_before_income_tax,
    )

    net = profit_before_income_tax - income_tax
    return float(vat_payable), float(income_tax), float(net)


# ============================================================
# Эндпоинты
# ============================================================

@router.get("/summary", response_model=SummaryResponse)
def summary(
    days: int = Query(30, ge=1, le=365),
    marketplace: str = Query("all"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    date_from = (now - timedelta(days=days - 1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    # --- Агрегаты за весь период ---
    agg_filters = [
        SalesDaily.user_id == user.id,
        SalesDaily.date >= date_from,
    ]
    if marketplace != "all":
        agg_filters.append(Product.marketplace == marketplace)

    agg = (
        db.query(
            func.coalesce(func.sum(SalesDaily.revenue), 0).label("revenue"),
            func.coalesce(func.sum(SalesDaily.commission), 0).label("commission"),
            func.coalesce(func.sum(SalesDaily.logistics), 0).label("logistics"),
            func.coalesce(func.sum(SalesDaily.storage), 0).label("storage"),
            func.coalesce(func.sum(SalesDaily.ads), 0).label("ads"),
            func.coalesce(func.sum(SalesDaily.cost), 0).label("cost"),
            func.coalesce(func.sum(SalesDaily.orders), 0).label("orders"),
        )
        .join(Product, Product.id == SalesDaily.product_id)
        .filter(*agg_filters)
        .first()
    )

    revenue = float(agg.revenue)
    commission = float(agg.commission)
    logistics = float(agg.logistics)
    storage = float(agg.storage)
    ads = float(agg.ads)
    cost = float(agg.cost)
    orders = int(agg.orders)

    ebitda = revenue - commission - logistics - storage - ads - cost

    # Расходы, по которым есть входящий НДС (от поставщиков/МП)
    deductible = commission + logistics + storage + ads + cost

    vat_total, income_tax, net_profit = _calc_taxes(
        tax_mode=user.tax_mode or "usn_6",
        vat_rate=float(user.vat_rate or 0),
        revenue=revenue,
        deductible_expenses=deductible,
        ebitda=ebitda,
    )

    tax_total = vat_total + income_tax

    # Выручка без НДС — академически верный знаменатель для маржинальности
    vat_rate_dec = float(user.vat_rate or 0) / 100
    revenue_net = revenue / (1 + vat_rate_dec) if vat_rate_dec > 0 else revenue

    margin = (net_profit / revenue_net * 100) if revenue_net > 0 else 0.0

    # --- Точки по дням с разбивкой по МП ---
    daily_filters = [
        SalesDaily.user_id == user.id,
        SalesDaily.date >= date_from,
    ]
    if marketplace != "all":
        daily_filters.append(Product.marketplace == marketplace)

    daily_rows = (
        db.query(
            func.date(SalesDaily.date).label("d"),
            Product.marketplace.label("mp"),
            func.coalesce(func.sum(SalesDaily.revenue), 0).label("revenue"),
            func.coalesce(func.sum(SalesDaily.commission), 0).label("commission"),
            func.coalesce(func.sum(SalesDaily.logistics), 0).label("logistics"),
            func.coalesce(func.sum(SalesDaily.storage), 0).label("storage"),
            func.coalesce(func.sum(SalesDaily.ads), 0).label("ads"),
            func.coalesce(func.sum(SalesDaily.cost), 0).label("cost"),
        )
        .join(Product, Product.id == SalesDaily.product_id)
        .filter(*daily_filters)
        .group_by(func.date(SalesDaily.date), Product.marketplace)
        .order_by(func.date(SalesDaily.date))
        .all()
    )

    # Промежуточный сбор: date → mp → EBITDA
    by_date: dict = {}
    for row in daily_rows:
        d_str = str(row.d)
        day_ebitda = float(
            row.revenue - row.commission - row.logistics
            - row.storage - row.ads - row.cost
        )
        if d_str not in by_date:
            by_date[d_str] = {
                "date": d_str,
                "revenue": 0.0, "ebitda": 0.0, "net_profit": 0.0,
                "revenue_wb": 0.0, "revenue_ozon": 0.0, "revenue_yandex": 0.0,
                "ebitda_wb": 0.0, "ebitda_ozon": 0.0, "ebitda_yandex": 0.0,
            }
        by_date[d_str]["revenue"] += float(row.revenue)
        by_date[d_str]["ebitda"] += day_ebitda
        if row.mp == "wb":
            by_date[d_str]["revenue_wb"] += float(row.revenue)
            by_date[d_str]["ebitda_wb"] += day_ebitda
        elif row.mp == "ozon":
            by_date[d_str]["revenue_ozon"] += float(row.revenue)
            by_date[d_str]["ebitda_ozon"] += day_ebitda
        elif row.mp == "yandex":
            by_date[d_str]["revenue_yandex"] += float(row.revenue)
            by_date[d_str]["ebitda_yandex"] += day_ebitda

    # Считаем налоговые ставки от итоговых KPI, применяем пропорционально к каждому дню
    tax_share = (tax_total / ebitda) if ebitda > 0 else 0.0

    daily = []
    for d_str, values in sorted(by_date.items()):
        net = values["ebitda"] * (1 - tax_share) if tax_share > 0 else values["ebitda"]
        values["net_profit"] = net
        daily.append(DailyPoint(**values))

    return SummaryResponse(
        kpi=KpiOut(
            revenue=round(revenue, 2),
            revenue_net=round(revenue_net, 2),
            ebitda=round(ebitda, 2),
            tax_total=round(tax_total, 2),
            vat=round(vat_total, 2),
            income_tax=round(income_tax, 2),
            net_profit=round(net_profit, 2),
            orders=orders,
            margin_percent=round(margin, 2),
        ),
        daily=daily,
        period_days=days,
        marketplace=marketplace,
        tax_mode=user.tax_mode or "usn_6",
        vat_rate=float(user.vat_rate or 0),
    )


@router.get("/products", response_model=ProductsResponse)
def products(
    days: int = Query(30, ge=1, le=365),
    marketplace: str = Query("all"),
    limit: int = Query(100, ge=1, le=500),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    date_from = (now - timedelta(days=days - 1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    filters = [
        Product.user_id == user.id,
        SalesDaily.date >= date_from,
    ]
    if marketplace != "all":
        filters.append(Product.marketplace == marketplace)

    rows = (
        db.query(
            Product.id,
            Product.sku,
            Product.name,
            Product.marketplace,
            func.coalesce(func.sum(SalesDaily.revenue), 0).label("revenue"),
            func.coalesce(func.sum(SalesDaily.commission), 0).label("commission"),
            func.coalesce(func.sum(SalesDaily.logistics), 0).label("logistics"),
            func.coalesce(func.sum(SalesDaily.storage), 0).label("storage"),
            func.coalesce(func.sum(SalesDaily.ads), 0).label("ads"),
            func.coalesce(func.sum(SalesDaily.cost), 0).label("cost"),
            func.coalesce(func.sum(SalesDaily.orders), 0).label("orders"),
        )
        .join(SalesDaily, SalesDaily.product_id == Product.id)
        .filter(*filters)
        .group_by(Product.id, Product.sku, Product.name, Product.marketplace)
        .order_by(func.sum(SalesDaily.revenue).desc())
        .limit(limit)
        .all()
    )

    # Общая выручка и EBITDA выборки — чтобы распределить налоги пропорционально
    total_revenue = sum(float(r.revenue) for r in rows)
    total_ebitda = sum(
        float(r.revenue) - float(r.commission) - float(r.logistics)
        - float(r.storage) - float(r.ads) - float(r.cost)
        for r in rows
    )

    # Считаем общие налоги на выборке (те же формулы, что в summary)
    total_deductible = sum(
        float(r.commission) + float(r.logistics) + float(r.storage)
        + float(r.ads) + float(r.cost)
        for r in rows
    )
    vat_total_p, income_tax_p, _ = _calc_taxes(
        tax_mode=user.tax_mode or "usn_6",
        vat_rate=float(user.vat_rate or 0),
        revenue=total_revenue,
        deductible_expenses=total_deductible,
        ebitda=total_ebitda,
    )
    total_tax_p = vat_total_p + income_tax_p

    # Коэффициент: сколько копеек налога на 1 рубль EBITDA
    tax_share = (total_tax_p / total_ebitda) if total_ebitda > 0 else 0.0

    vat_rate_dec = float(user.vat_rate or 0) / 100

    products_out = []
    for row in rows:
        revenue = float(row.revenue)
        ebitda = revenue - float(row.commission) - float(row.logistics) \
                 - float(row.storage) - float(row.ads) - float(row.cost)

        # Чистая прибыль SKU = EBITDA × (1 − tax_share)
        net_profit_sku = ebitda * (1 - tax_share)

        # Выручка без НДС для знаменателя
        revenue_net = revenue / (1 + vat_rate_dec) if vat_rate_dec > 0 else revenue

        # Чистая маржинальность = Чистая прибыль / Выручка без НДС × 100
        margin = (net_profit_sku / revenue_net * 100) if revenue_net > 0 else 0.0

        products_out.append(ProductRow(
            product_id=row.id,
            sku=row.sku,
            name=row.name,
            marketplace=row.marketplace,
            revenue=round(revenue, 2),
            ebitda=round(ebitda, 2),
            orders=int(row.orders),
            margin_percent=round(margin, 2),
        ))

    return ProductsResponse(products=products_out, period_days=days)
