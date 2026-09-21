"""API дашборда: KPI, график, таблица товаров."""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db import get_db
from app.models import Product, SalesDaily, User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


# ============================================================
# Схемы ответа
# ============================================================

class KpiOut(BaseModel):
    revenue: float
    profit: float
    orders: int
    margin_percent: float  # profit / revenue * 100


class DailyPoint(BaseModel):
    date: str  # YYYY-MM-DD
    revenue: float
    profit: float


class SummaryResponse(BaseModel):
    kpi: KpiOut
    daily: list[DailyPoint]
    period_days: int
    marketplace: str


class ProductRow(BaseModel):
    product_id: int
    sku: str
    name: str
    marketplace: str
    revenue: float
    profit: float
    orders: int
    margin_percent: float


class ProductsResponse(BaseModel):
    products: list[ProductRow]
    period_days: int


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
    """KPI + точки для графика динамики за период."""
    now = datetime.now(timezone.utc)
    date_from = (now - timedelta(days=days - 1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    q = db.query(SalesDaily).filter(
        SalesDaily.user_id == user.id,
        SalesDaily.date >= date_from,
    )
    if marketplace != "all":
        q = q.join(Product, Product.id == SalesDaily.product_id).filter(
            Product.marketplace == marketplace
        )

    # KPI за весь период
    agg = q.with_entities(
        func.coalesce(func.sum(SalesDaily.revenue), 0).label("revenue"),
        func.coalesce(func.sum(SalesDaily.profit), 0).label("profit"),
        func.coalesce(func.sum(SalesDaily.orders), 0).label("orders"),
    ).first()

    revenue = float(agg.revenue)
    profit = float(agg.profit)
    orders = int(agg.orders)
    margin = (profit / revenue * 100) if revenue > 0 else 0.0

    # Точки по дням
    daily_rows = q.with_entities(
        func.date(SalesDaily.date).label("d"),
        func.coalesce(func.sum(SalesDaily.revenue), 0).label("revenue"),
        func.coalesce(func.sum(SalesDaily.profit), 0).label("profit"),
    ).group_by(func.date(SalesDaily.date)).order_by(func.date(SalesDaily.date)).all()

    daily = [
        DailyPoint(
            date=str(row.d),
            revenue=float(row.revenue),
            profit=float(row.profit),
        )
        for row in daily_rows
    ]

    return SummaryResponse(
        kpi=KpiOut(
            revenue=round(revenue, 2),
            profit=round(profit, 2),
            orders=orders,
            margin_percent=round(margin, 2),
        ),
        daily=daily,
        period_days=days,
        marketplace=marketplace,
    )


@router.get("/products", response_model=ProductsResponse)
def products(
    days: int = Query(30, ge=1, le=365),
    marketplace: str = Query("all"),
    limit: int = Query(100, ge=1, le=500),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Таблица товаров с агрегатами за период."""
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
            func.coalesce(func.sum(SalesDaily.profit), 0).label("profit"),
            func.coalesce(func.sum(SalesDaily.orders), 0).label("orders"),
        )
        .join(SalesDaily, SalesDaily.product_id == Product.id)
        .filter(*filters)
        .group_by(Product.id, Product.sku, Product.name, Product.marketplace)
        .order_by(func.sum(SalesDaily.revenue).desc())
        .limit(limit)
        .all()
    )

    products_out = []
    for row in rows:
        revenue = float(row.revenue)
        profit = float(row.profit)
        margin = (profit / revenue * 100) if revenue > 0 else 0.0
        products_out.append(ProductRow(
            product_id=row.id,
            sku=row.sku,
            name=row.name,
            marketplace=row.marketplace,
            revenue=round(revenue, 2),
            profit=round(profit, 2),
            orders=int(row.orders),
            margin_percent=round(margin, 2),
        ))

    return ProductsResponse(products=products_out, period_days=days)
