"""Точка входа backend-сервиса Юнит-Фокус."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    version="0.5.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_wb_calc = WbFboCalculator()
_ozon_calc = OzonFboCalculator()
_yandex_calc = YandexFbyCalculator()


@app.get("/")
def root():
    return {"service": "Юнит-Фокус API", "version": "0.5.0", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "healthy"}


# Публичное чтение тарифов (для калькулятора)
app.include_router(public_tariffs.router, prefix="/api/v1")


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


# Админка (требует заголовок X-Admin-Password)
app.include_router(admin_tariffs.router, prefix="/api/v1/admin")
app.include_router(admin_taxes.router, prefix="/api/v1/admin")
