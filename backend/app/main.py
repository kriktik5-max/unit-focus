"""Точка входа backend-сервиса UnitCalc."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.domains.marketplaces.wildberries.calculator import WbFboCalculator
from app.domains.marketplaces.wildberries.schemas import WbFboInput, WbFboOutput

app = FastAPI(
    title="UnitCalc API",
    description="Юнит-экономика для российских маркетплейсов",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_wb_calc = WbFboCalculator()


@app.get("/")
def root():
    return {"service": "UnitCalc API", "version": "0.1.0", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/api/v1/calculations/wb-fbo", response_model=WbFboOutput)
def calculate_wb_fbo(payload: WbFboInput) -> WbFboOutput:
    return _wb_calc.calculate(payload)
