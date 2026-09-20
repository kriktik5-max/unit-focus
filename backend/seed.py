"""Наполнение базы стартовыми значениями тарифов и налогов."""
from decimal import Decimal

from app.db import SessionLocal
from app.models import TariffSetting, TaxRate


TAX_RATES = [
    ("none", "Без налога", Decimal("0")),
    ("self_employed", "Самозанятый", Decimal("6")),
    ("usn_6", "УСН «Доходы»", Decimal("6")),
    ("usn_15", "УСН «Доходы − Расходы»", Decimal("15")),
    ("osno", "ОСНО", Decimal("20")),
]


TARIFFS = [
    # Wildberries FBO
    ("wb_fbo", "commission_percent", Decimal("20"), "Комиссия WB, %"),
    ("wb_fbo", "logistics_cost", Decimal("80"), "Логистика за единицу, ₽"),
    ("wb_fbo", "storage_cost", Decimal("10"), "Хранение за единицу, ₽"),
    ("wb_fbo", "acquiring_percent", Decimal("0"), "Эквайринг, %"),
    ("wb_fbo", "ads_cost", Decimal("50"), "Реклама за единицу, ₽"),
    ("wb_fbo", "return_rate_percent", Decimal("0"), "Доля возвратов, %"),

    # Ozon FBO
    ("ozon_fbo", "commission_percent", Decimal("15"), "Комиссия Ozon, %"),
    ("ozon_fbo", "logistics_base", Decimal("46.77"), "Логистика: базовый тариф, ₽"),
    ("ozon_fbo", "logistics_per_liter", Decimal("10.17"), "Логистика: надбавка за литр, ₽"),
    ("ozon_fbo", "last_mile_percent", Decimal("5.5"), "Последняя миля, %"),
    ("ozon_fbo", "last_mile_max", Decimal("500"), "Макс. последней мили, ₽"),
    ("ozon_fbo", "acquiring_percent", Decimal("2.2"), "Эквайринг Ozon Pay, %"),
    ("ozon_fbo", "storage_cost", Decimal("0"), "Хранение за единицу, ₽"),
    ("ozon_fbo", "ads_cost", Decimal("50"), "Реклама за единицу, ₽"),
    ("ozon_fbo", "return_rate_percent", Decimal("0"), "Доля возвратов, %"),
    ("ozon_fbo", "return_utilization_cost", Decimal("0"), "Утилизация возврата, ₽"),

    # Яндекс Маркет FBY
    ("yandex_fby", "commission_percent", Decimal("20"), "Комиссия Яндекс Маркет, %"),
    ("yandex_fby", "logistics_first_liter", Decimal("80"), "Логистика: 1-й литр, ₽"),
    ("yandex_fby", "logistics_per_additional_liter", Decimal("9"), "Логистика: за доп. литр, ₽"),
    ("yandex_fby", "logistics_max", Decimal("5500"), "Максимум логистики, ₽"),
    ("yandex_fby", "delivery_percent", Decimal("5"), "Доставка покупателю, %"),
    ("yandex_fby", "delivery_max", Decimal("1000"), "Макс. доставки покупателю, ₽"),
    ("yandex_fby", "order_processing", Decimal("25"), "Обработка заказа, ₽"),
    ("yandex_fby", "acquiring_percent", Decimal("0"), "Эквайринг, %"),
    ("yandex_fby", "storage_cost", Decimal("0"), "Хранение за единицу, ₽"),
    ("yandex_fby", "ads_cost", Decimal("50"), "Реклама за единицу, ₽"),
    ("yandex_fby", "return_rate_percent", Decimal("0"), "Доля возвратов, %"),
    ("yandex_fby", "return_utilization_cost", Decimal("0"), "Утилизация возврата, ₽"),
]


def seed():
    db = SessionLocal()
    try:
        # Налоги
        for code, name, rate in TAX_RATES:
            existing = db.query(TaxRate).filter_by(code=code).first()
            if not existing:
                db.add(TaxRate(code=code, name=name, rate_percent=rate))
                print(f"+ Налог: {code}")
            else:
                print(f"= Налог уже есть: {code}")

        # Тарифы
        for mp, key, value, desc in TARIFFS:
            existing = (
                db.query(TariffSetting)
                .filter_by(marketplace=mp, key=key)
                .first()
            )
            if not existing:
                db.add(TariffSetting(
                    marketplace=mp, key=key, value=value, description=desc
                ))
                print(f"+ Тариф: {mp}.{key} = {value}")
            else:
                print(f"= Тариф уже есть: {mp}.{key}")

        db.commit()
        print("\n✅ Наполнение завершено")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
