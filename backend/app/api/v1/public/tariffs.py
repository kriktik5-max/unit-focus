"""Публичное чтение тарифов из БД (без пароля)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import TariffSetting

router = APIRouter(prefix="/tariffs", tags=["tariffs"])

VALID_MARKETPLACES = {"wb_fbo", "ozon_fbo", "yandex_fby"}


@router.get("/{marketplace}")
def get_tariff_defaults(marketplace: str, db: Session = Depends(get_db)):
    """Возвращает дефолтные значения тарифов маркетплейса в виде {key: value}.

    Пример: /api/v1/tariffs/wb_fbo
    Ответ: {"commission_percent": 20.0, "logistics_cost": 80.0, ...}
    """
    if marketplace not in VALID_MARKETPLACES:
        raise HTTPException(
            status_code=404,
            detail=f"Маркетплейс {marketplace} не найден. Доступно: {sorted(VALID_MARKETPLACES)}",
        )

    items = db.query(TariffSetting).filter_by(marketplace=marketplace).all()
    return {item.key: float(item.value) for item in items}
