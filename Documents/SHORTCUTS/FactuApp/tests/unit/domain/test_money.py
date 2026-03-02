from decimal import Decimal
import pytest

from app.domain.value_objects.money import MonetaryValidationError, to_decimal


def test_round_half_up_policy():
    assert to_decimal("1.005") == Decimal("1.01")
    assert to_decimal("1.004") == Decimal("1.00")


def test_float_input_is_rejected():
    with pytest.raises(MonetaryValidationError, match="Float monetary input is not allowed"):
        to_decimal(1.25)  # type: ignore[arg-type]


def test_non_decimal_non_string_input_is_rejected():
    with pytest.raises(MonetaryValidationError, match="Invalid monetary input type"):
        to_decimal(2)  # type: ignore[arg-type]
