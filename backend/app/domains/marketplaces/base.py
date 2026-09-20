"""Базовый контракт для калькуляторов маркетплейсов."""
from abc import ABC, abstractmethod

from pydantic import BaseModel


class MarketplaceCalculator(ABC):
    """Базовый контракт калькулятора юнит-экономики маркетплейса."""

    marketplace_code: str = "unknown"

    @abstractmethod
    def calculate(self, payload: BaseModel) -> BaseModel:
        ...
