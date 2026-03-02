from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from app.domain.value_objects.money import add, to_decimal


@dataclass(slots=True)
class InvoiceLine:
    description: str
    quantity: Decimal
    unit_price: Decimal
    tax_rate: Decimal = Decimal("0.21")
    discount_pct: Decimal = Decimal("0")

    @property
    def line_subtotal(self) -> Decimal:
        return to_decimal(self.quantity * self.unit_price * (1 - self.discount_pct / 100))

    @property
    def line_tax(self) -> Decimal:
        return to_decimal(self.line_subtotal * self.tax_rate)

    @property
    def line_total(self) -> Decimal:
        return add([self.line_subtotal, self.line_tax])
