"""API управления налоговыми ставками (только для админа)."""
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.v1.admin.auth import require_admin
from app.db import get_db
from app.models import TaxRate

router = APIRouter(
    prefix="/taxes",
    tags=["admin: taxes"],
    dependencies=[Depends(require_admin)],
)


class TaxOut(BaseModel):
    id: int
    code: str
    name: str
    rate_percent: Decimal
    is_active: bool

    class Config:
        from_attributes = True


class TaxCreate(BaseModel):
    code: str = Field(min_length=2, max_length=32)
    name: str = Field(min_length=1, max_length=128)
    rate_percent: Decimal
    is_active: bool = True


class TaxUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=128)
    rate_percent: Decimal | None = None
    is_active: bool | None = None


@router.get("", response_model=list[TaxOut])
def list_taxes(db: Session = Depends(get_db)):
    return db.query(TaxRate).order_by(TaxRate.code).all()


@router.get("/{tax_id}", response_model=TaxOut)
def get_tax(tax_id: int, db: Session = Depends(get_db)):
    obj = db.get(TaxRate, tax_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Налог не найден")
    return obj


@router.post("", response_model=TaxOut, status_code=status.HTTP_201_CREATED)
def create_tax(payload: TaxCreate, db: Session = Depends(get_db)):
    existing = db.query(TaxRate).filter_by(code=payload.code).first()
    if existing:
        raise HTTPException(
            status_code=409, detail=f"Налог с кодом {payload.code} уже существует"
        )
    obj = TaxRate(
        code=payload.code,
        name=payload.name,
        rate_percent=payload.rate_percent,
        is_active=payload.is_active,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{tax_id}", response_model=TaxOut)
def update_tax(
    tax_id: int, payload: TaxUpdate, db: Session = Depends(get_db)
):
    obj = db.get(TaxRate, tax_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Налог не найден")
    if payload.name is not None:
        obj.name = payload.name
    if payload.rate_percent is not None:
        obj.rate_percent = payload.rate_percent
    if payload.is_active is not None:
        obj.is_active = payload.is_active
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{tax_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tax(tax_id: int, db: Session = Depends(get_db)):
    obj = db.get(TaxRate, tax_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Налог не найден")
    db.delete(obj)
    db.commit()
