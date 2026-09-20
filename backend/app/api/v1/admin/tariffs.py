"""API управления тарифами маркетплейсов (только для админа)."""
from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.v1.admin.auth import require_admin
from app.db import get_db
from app.models import TariffSetting

router = APIRouter(
    prefix="/tariffs",
    tags=["admin: tariffs"],
    dependencies=[Depends(require_admin)],
)


class TariffOut(BaseModel):
    id: int
    marketplace: str
    key: str
    value: Decimal
    description: str
    updated_at: datetime

    class Config:
        from_attributes = True


class TariffCreate(BaseModel):
    marketplace: str = Field(min_length=2, max_length=32)
    key: str = Field(min_length=1, max_length=64)
    value: Decimal
    description: str = Field(default="", max_length=255)


class TariffUpdate(BaseModel):
    value: Decimal | None = None
    description: str | None = Field(default=None, max_length=255)


@router.get("", response_model=list[TariffOut])
def list_tariffs(
    marketplace: str | None = None,
    db: Session = Depends(get_db),
):
    """Список всех тарифов, опционально — фильтр по маркетплейсу."""
    q = db.query(TariffSetting)
    if marketplace:
        q = q.filter(TariffSetting.marketplace == marketplace)
    return q.order_by(TariffSetting.marketplace, TariffSetting.key).all()


@router.get("/{tariff_id}", response_model=TariffOut)
def get_tariff(tariff_id: int, db: Session = Depends(get_db)):
    obj = db.get(TariffSetting, tariff_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Тариф не найден")
    return obj


@router.post("", response_model=TariffOut, status_code=status.HTTP_201_CREATED)
def create_tariff(payload: TariffCreate, db: Session = Depends(get_db)):
    """Создать новый тариф."""
    existing = (
        db.query(TariffSetting)
        .filter_by(marketplace=payload.marketplace, key=payload.key)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Тариф {payload.marketplace}.{payload.key} уже существует",
        )
    obj = TariffSetting(
        marketplace=payload.marketplace,
        key=payload.key,
        value=payload.value,
        description=payload.description,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{tariff_id}", response_model=TariffOut)
def update_tariff(
    tariff_id: int,
    payload: TariffUpdate,
    db: Session = Depends(get_db),
):
    """Изменить значение или описание тарифа."""
    obj = db.get(TariffSetting, tariff_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Тариф не найден")
    if payload.value is not None:
        obj.value = payload.value
    if payload.description is not None:
        obj.description = payload.description
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{tariff_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tariff(tariff_id: int, db: Session = Depends(get_db)):
    obj = db.get(TariffSetting, tariff_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Тариф не найден")
    db.delete(obj)
    db.commit()
