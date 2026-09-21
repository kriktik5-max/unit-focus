"""Генерация демо-данных для дашборда: 20 товаров × 30 дней.

По умолчанию — локальная БД. Для облака: USE_SUPABASE=1 python scripts/seed_demo.py
"""
import getpass
import os
import random
import sys
from datetime import datetime, timedelta, timezone

import psycopg


SKUS = [
    ("WB-001", "Футболка хлопок oversize", 350, "wb"),
    ("WB-002", "Джинсы женские Mom Fit", 1200, "wb"),
    ("WB-003", "Худи утеплённое с принтом", 900, "wb"),
    ("WB-004", "Кроссовки белые кожаные", 1800, "wb"),
    ("WB-005", "Сумка-шоппер холщовая", 500, "wb"),
    ("WB-006", "Носки хлопковые, набор 5 пар", 150, "wb"),
    ("WB-007", "Платье миди в цветочек", 1400, "wb"),
    ("OZ-001", "Наушники TWS беспроводные", 800, "ozon"),
    ("OZ-002", "Чехол для iPhone силиконовый", 150, "ozon"),
    ("OZ-003", "Powerbank 10000 mAh", 700, "ozon"),
    ("OZ-004", "Мышь беспроводная эргономичная", 400, "ozon"),
    ("OZ-005", "Клавиатура механическая RGB", 2500, "ozon"),
    ("OZ-006", "Кабель USB-C 2 метра", 100, "ozon"),
    ("OZ-007", "Подставка для ноутбука алюминиевая", 600, "ozon"),
    ("YA-001", "Кофеварка капельная 1.5 л", 2000, "yandex"),
    ("YA-002", "Чайник электрический стеклянный", 1200, "yandex"),
    ("YA-003", "Блендер погружной 800 Вт", 1500, "yandex"),
    ("YA-004", "Микроволновка 20 литров", 3500, "yandex"),
    ("YA-005", "Тостер 2-секционный", 1000, "yandex"),
    ("YA-006", "Весы кухонные электронные", 400, "yandex"),
]


def connect():
    """Подключается к БД: облако при USE_SUPABASE=1, иначе локально."""
    if os.environ.get("USE_SUPABASE") == "1":
        pw = os.environ.get("SUPABASE_PW", "").strip()
        if not pw:
            print("❌ Не найден SUPABASE_PW. Сначала: source ~/.zshrc")
            sys.exit(1)
        print("🌐 Подключаюсь к Supabase")
        return psycopg.connect(
            host="aws-1-eu-west-1.pooler.supabase.com",
            port=6543,
            dbname="postgres",
            user="postgres.nzkokodfheolhajfnnca",
            password=pw,
            connect_timeout=30,
            sslmode="require",
        )
    user = getpass.getuser()
    print(f"💻 Подключаюсь к локальной БД (пользователь {user})")
    return psycopg.connect(
        host="localhost",
        port=5432,
        dbname="unitfocus",
        user=user,
        connect_timeout=15,
    )


def seed():
    conn = connect()
    random.seed(42)

    with conn.cursor() as cur:
        cur.execute("SELECT id, email FROM users ORDER BY id")
        users = cur.fetchall()
        if not users:
            print("❌ В базе нет юзеров.")
            return

        print(f"Найдено юзеров: {len(users)}")

        for user_id, email in users:
            print(f"\n=== user_id={user_id} ({email}) ===")

            cur.execute(
                "SELECT COUNT(*) FROM sales_daily WHERE user_id = %s",
                (user_id,),
            )
            existing = cur.fetchone()[0]
            if existing > 0:
                print(f"  ⏭  Пропускаю: уже {existing} записей")
                continue

            for sku, name, cost, mp in SKUS:
                cur.execute(
                    """
                    INSERT INTO products (user_id, sku, name, marketplace, cost_price)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (user_id, sku, marketplace) DO NOTHING
                    """,
                    (user_id, sku, name, mp, cost),
                )

            cur.execute(
                "SELECT id, cost_price FROM products WHERE user_id = %s ORDER BY id",
                (user_id,),
            )
            products = cur.fetchall()

            today = datetime.now(timezone.utc).date()
            start_date = today - timedelta(days=29)

            rows = []
            for prod_id, cost in products:
                cost = float(cost)
                for day_offset in range(30):
                    date = start_date + timedelta(days=day_offset)
                    orders = random.randint(0, 15)
                    price = round(cost * random.uniform(2.0, 3.5))
                    revenue = orders * price

                    commission = round(revenue * random.uniform(0.15, 0.25), 2)
                    logistics = orders * random.randint(60, 150)
                    storage = random.randint(0, 100)
                    ads = round(revenue * random.uniform(0.05, 0.15), 2)
                    tax = round(revenue * 0.06, 2)
                    cost_total = orders * cost
                    profit = revenue - commission - logistics - storage - ads - tax - cost_total

                    rows.append((
                        user_id, prod_id, date,
                        revenue, orders,
                        commission, logistics, storage, ads, tax, cost_total, profit,
                    ))

            cur.executemany(
                """
                INSERT INTO sales_daily
                (user_id, product_id, date, revenue, orders,
                 commission, logistics, storage, ads, tax, cost, profit)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                rows,
            )
            print(f"  ✅ Товаров: {len(products)}, записей о продажах: {len(rows)}")

    conn.commit()
    conn.close()
    print("\n✅ Готово")


if __name__ == "__main__":
    seed()
