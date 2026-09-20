"""Точка входа backend-сервиса Юнит-Фокус."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.domains.marketplaces.wildberries.calculator import WbFboCalculator
from app.domains.marketplaces.wildberries.schemas import WbFboInput, WbFboOutput
from app.domains.marketplaces.ozon.calculator import OzonFboCalculator
from app.domains.marketplaces.ozon.schemas import OzonFboInput, OzonFboOutput

app = FastAPI(
    title="Юнит-Фокус API",
    description="Юнит-экономика для российских маркетплейсов",
    version="0.2.0",
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


@app.get("/")
def root():
    return {"service": "Юнит-Фокус API", "version": "0.2.0", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/api/v1/calculations/wb-fbo", response_model=WbFboOutput)
def calculate_wb_fbo(payload: WbFboInput) -> WbFboOutput:
    return _wb_calc.calculate(payload)


@app.post("/api/v1/calculations/ozon-fbo", response_model=OzonFboOutput)
def calculate_ozon_fbo(payload: OzonFboInput) -> OzonFboOutput:
    return _ozon_calc.calculate(payload)
