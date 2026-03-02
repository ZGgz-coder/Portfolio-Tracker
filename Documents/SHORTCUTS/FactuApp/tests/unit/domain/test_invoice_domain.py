from datetime import date, datetime
from decimal import Decimal

import pytest

from app.domain.entities.invoice import Invoice
from app.domain.rules.invoice_invariants import DomainError, OfficialInvoiceImmutableError, OfficializationInvariantError
from app.domain.services.invoice_state_machine import ensure_transition
from app.domain.value_objects.invoice_status import InvoiceStatus
from app.domain.value_objects.money import MonetaryValidationError


def _line(desc: str, qty: str, price: str):
    return Invoice.create_line(desc, qty, price)


def test_invoice_totals_are_decimal_based():
    invoice = Invoice(
        id="inv-1",
        status=InvoiceStatus.DRAFT,
        issue_date=date(2026, 2, 18),
        client_id="c1",
        lines=[_line("Instalacion split", "1", "100.00"), _line("Mantenimiento", "2", "50.00")],
    )
    assert invoice.subtotal == Decimal("200.00")
    assert invoice.tax_amount == Decimal("42.00")
    assert invoice.total == Decimal("242.00")


def test_only_draft_can_be_updated():
    invoice = Invoice(
        id="inv-2",
        status=InvoiceStatus.SPECIAL,
        issue_date=date(2026, 2, 18),
        client_id="c1",
        lines=[_line("Trabajo", "1", "10")],
    )
    with pytest.raises(DomainError):
        invoice.update_lines_and_notes([_line("Otro", "1", "20")], None)


def test_mark_official_assigns_code():
    invoice = Invoice(
        id="inv-3",
        status=InvoiceStatus.DRAFT,
        issue_date=date(2026, 2, 18),
        client_id="c1",
        lines=[_line("Trabajo", "1", "10")],
    )
    invoice.mark_official(2026, 1, datetime(2026, 2, 18, 12, 0, 0))
    assert invoice.status == InvoiceStatus.OFFICIAL
    assert invoice.official_code == "2026-000001"
    assert invoice.integrity_hash is not None
    assert invoice.verify_integrity() is True


def test_invoice_line_creation_rejects_float_inputs():
    with pytest.raises(MonetaryValidationError, match="Float monetary input is not allowed"):
        Invoice.create_line("Trabajo", 1.0, "10.00")  # type: ignore[arg-type]

    with pytest.raises(MonetaryValidationError, match="Float monetary input is not allowed"):
        Invoice.create_line("Trabajo", "1.00", 10.0)  # type: ignore[arg-type]


def test_invalid_state_transitions_are_rejected():
    with pytest.raises(DomainError):
        ensure_transition(InvoiceStatus.OFFICIAL, InvoiceStatus.DRAFT)
    with pytest.raises(DomainError):
        ensure_transition(InvoiceStatus.OFFICIAL, InvoiceStatus.SPECIAL)
    with pytest.raises(DomainError):
        ensure_transition(InvoiceStatus.SPECIAL, InvoiceStatus.OFFICIAL)


def test_official_invoice_is_immutable_for_fiscal_fields():
    invoice = Invoice(
        id="inv-immutable-1",
        status=InvoiceStatus.DRAFT,
        issue_date=date(2026, 2, 18),
        client_id="c1",
        lines=[_line("Trabajo", "1", "10")],
    )
    invoice.mark_official(2026, 1, datetime(2026, 2, 18, 12, 0, 0))
    with pytest.raises(OfficialInvoiceImmutableError):
        invoice.client_id = "c2"
    with pytest.raises(OfficialInvoiceImmutableError):
        invoice.issue_date = date(2026, 2, 19)
    with pytest.raises(OfficialInvoiceImmutableError):
        invoice.lines = (_line("Otro", "1", "20"),)


def test_non_fiscal_metadata_update_can_be_explicitly_allowed():
    invoice = Invoice(
        id="inv-meta-1",
        status=InvoiceStatus.DRAFT,
        issue_date=date(2026, 2, 18),
        client_id="c1",
        lines=[_line("Trabajo", "1", "10")],
    )
    invoice.mark_official(2026, 1, datetime(2026, 2, 18, 12, 0, 0))
    invoice.update_notes("Solo metadata")
    assert invoice.notes == "Solo metadata"
    assert invoice.verify_integrity() is True


def test_officialization_invariant_negative_total_rejected():
    invoice = Invoice(
        id="inv-neg-1",
        status=InvoiceStatus.DRAFT,
        issue_date=date(2026, 2, 18),
        client_id="c1",
        lines=[_line("Trabajo", "-1", "10")],
    )
    with pytest.raises(OfficializationInvariantError, match="negative totals"):
        invoice.mark_official(2026, 1, datetime(2026, 2, 18, 12, 0, 0))


def test_integrity_hash_detects_tampering():
    invoice = Invoice(
        id="inv-hash-1",
        status=InvoiceStatus.DRAFT,
        issue_date=date(2026, 2, 18),
        client_id="c1",
        lines=[_line("Trabajo", "1", "10")],
    )
    invoice.mark_official(2026, 1, datetime(2026, 2, 18, 12, 0, 0))
    assert invoice.verify_integrity() is True

    # Bypass protections to simulate external corruption.
    object.__setattr__(invoice, "notes", "tampered")
    assert invoice.verify_integrity() is True
    object.__setattr__(invoice, "lines", (_line("Trabajo alterado", "1", "11"),))
    assert invoice.verify_integrity() is False


def test_officialization_rejects_inconsistent_line_totals():
    class BrokenLine:
        description = "Linea corrupta"
        quantity = Decimal("1.00")
        unit_price = Decimal("10.00")
        tax_rate = Decimal("0.21")
        line_subtotal = Decimal("10.00")
        line_tax = Decimal("2.10")
        line_total = Decimal("99.99")

    invoice = Invoice(
        id="inv-inconsistent-1",
        status=InvoiceStatus.DRAFT,
        issue_date=date(2026, 2, 18),
        client_id="c1",
        lines=[BrokenLine()],  # type: ignore[list-item]
    )
    with pytest.raises(OfficializationInvariantError, match="inconsistent"):
        invoice.mark_official(2026, 1, datetime(2026, 2, 18, 12, 0, 0))
