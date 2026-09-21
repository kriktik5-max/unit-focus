"""Точка входа backend-сервиса Юнит-Фокус."""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth as auth_router
from app.api.v1.admin import auth as admin_auth
from app.api.v1.admin import tariffs as admin_tariffs
from app.api.v1.admin import taxes as admin_taxes
from app.api.v1.public import tariffs as public_tariffs
from app.domains.marketplaces.wildberries.calculator import WbFboCalculator
from app.domains.marketplaces.wildberries.schemas import WbFboInput, WbFboOutput
from app.domains.marketplaces.ozon.calculator import OzonFboCalculator
from app.domains.marketplaces.ozon.schemas import OzonFboInput, OzonFboOutput
from app.domains.marketplaces.yandex.calculator import YandexFbyCalculator
from app.domains.marketplaces.yandex.schemas import YandexFbyInput, YandexFbyOutput

app = FastAPI(
    title="Юнит-Фокус API",
    description="Юнит-экономика для российских маркетплейсов",
    version="0.7.0",
)

# CORS: localhost + список из переменной
_default_origins = ["http://localhost:3000"]
_env_origins = [u.strip() for u in os.environ.get("FRONTEND_URLS", "").split(",") if u.strip()]
_allowed_origins = _default_origins + _env_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_wb_calc = WbFboCalculator()
_ozon_calc = OzonFboCalculator()
_yandex_calc = YandexFbyCalculator()


@app.get("/")
def root():
    return {"service": "Юнит-Фокус API", "version": "0.7.0", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "healthy"}


# Публичные тарифы (для калькулятора)
app.include_router(public_tariffs.router, prefix="/api/v1")

# Auth: регистрация, вход, профиль
app.include_router(auth_router.router, prefix="/api/v1")

# Расчёты
@app.post("/api/v1/calculations/wb-fbo", response_model=WbFboOutput)
def calculate_wb_fbo(payload: WbFboInput) -> WbFboOutput:
    return _wb_calc.calculate(payload)


@app.post("/api/v1/calculations/ozon-fbo", response_model=OzonFboOutput)
def calculate_ozon_fbo(payload: OzonFboInput) -> OzonFboOutput:
    return _ozon_calc.calculate(payload)


@app.post("/api/v1/calculations/yandex-fby", response_model=YandexFbyOutput)
def calculate_yandex_fby(payload: YandexFbyInput) -> YandexFbyOutput:
    return _yandex_calc.calculate(payload)


# Админка (X-Admin-Password)
app.include_router(admin_auth.router, prefix="/api/v1/admin")
app.include_router(admin_tariffs.router, prefix="/api/v1/admin")
app.include_router(admin_taxes.router, prefix="/api/v1/admin")
