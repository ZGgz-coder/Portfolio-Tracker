from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

TWOPLACES = Decimal("0.01")


class MonetaryValidationError(ValueError):
    pass


def to_decimal(value: Decimal | str) -> Decimal:
    if isinstance(value, float):
        raise MonetaryValidationError(
            "Float monetary input is not allowed. Use Decimal or string input."
        )
    if not isinstance(value, (Decimal, str)):
        raise MonetaryValidationError(
            "Invalid monetary input type. Use Decimal or string input."
        )
    if isinstance(value, Decimal):
        dec = value
    else:
        dec = Decimal(value)
    return dec.quantize(TWOPLACES, rounding=ROUND_HALF_UP)


def add(values: list[Decimal]) -> Decimal:
    total = sum(values, Decimal("0"))
    return total.quantize(TWOPLACES, rounding=ROUND_HALF_UP)
