"""Создание трёх тарифных планов: Free, Pro, Business."""
from decimal import Decimal

from app.db import SessionLocal
from app.models import Plan


PLANS = [
    {
        "code": "free",
        "name": "Free",
        "price_monthly": Decimal("0"),
        "description": "Для знакомства. Базовый расчёт для Wildberries.",
        "sort_order": 1,
        "limits": {
            "calculations_per_month": 10,
            "marketplaces": ["wb_fbo"],
            "history_days": 7,
            "export_excel": False,
            "api_access": False,
            "priority_support": False,
        },
    },
    {
        "code": "pro",
        "name": "Pro",
        "price_monthly": Decimal("990"),
        "description": "Для активных селлеров. Все маркетплейсы, без лимитов, экспорт.",
        "sort_order": 2,
        "limits": {
            "calculations_per_month": -1,
            "marketplaces": ["wb_fbo", "ozon_fbo", "yandex_fby"],
            "history_days": 365,
            "export_excel": True,
            "api_access": False,
            "priority_support": False,
        },
    },
    {
        "code": "business",
        "name": "Business",
        "price_monthly": Decimal("2990"),
        "description": "Для команд и агентств. API, приоритет, командный доступ.",
        "sort_order": 3,
        "limits": {
            "calculations_per_month": -1,
            "marketplaces": ["wb_fbo", "ozon_fbo", "yandex_fby"],
            "history_days": 3650,
            "export_excel": True,
            "api_access": True,
            "priority_support": True,
            "team_members": 5,
        },
    },
]


def seed():
    db = SessionLocal()
    try:
        for p in PLANS:
            existing = db.query(Plan).filter_by(code=p["code"]).first()
            if existing:
                print(f"= План уже есть: {p['code']}")
                continue
            db.add(Plan(**p))
            print(f"+ План создан: {p['code']} ({p['name']}) — {p['price_monthly']} руб/мес")
        db.commit()
        print("\nПланы в базе")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
