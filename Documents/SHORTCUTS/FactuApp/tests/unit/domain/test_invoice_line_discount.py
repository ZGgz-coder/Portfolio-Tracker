from __future__ import annotations

from decimal import Decimal

from app.domain.entities.invoice_line import InvoiceLine


def test_line_subtotal_no_discount():
    line = InvoiceLine(description="X", quantity=Decimal("2"), unit_price=Decimal("50"))
    assert line.line_subtotal == Decimal("100")


def test_line_subtotal_with_10_percent_discount():
    line = InvoiceLine(
        description="X",
        quantity=Decimal("1"),
        unit_price=Decimal("100"),
        discount_pct=Decimal("10"),
    )
    assert line.line_subtotal == Decimal("90.00")


def test_line_subtotal_with_100_percent_discount():
    line = InvoiceLine(
        description="X",
        quantity=Decimal("3"),
        unit_price=Decimal("50"),
        discount_pct=Decimal("100"),
    )
    assert line.line_subtotal == Decimal("0.00")


def test_line_tax_respects_discount():
    line = InvoiceLine(
        description="X",
        quantity=Decimal("1"),
        unit_price=Decimal("100"),
        discount_pct=Decimal("10"),
    )
    # subtotal = 90, tax = 90 * 0.21 = 18.90
    assert line.line_tax == Decimal("18.90")


def test_hash_includes_discount_via_subtotal():
    """Integrity hash captures line_subtotal which already encodes the discount."""
    from datetime import date
    from app.domain.entities.invoice import Invoice
    from app.domain.value_objects.invoice_status import InvoiceStatus

    line_nodiscount = InvoiceLine(
        description="Item",
        quantity=Decimal("1"),
        unit_price=Decimal("100"),
        discount_pct=Decimal("0"),
    )
    line_discount = InvoiceLine(
        description="Item",
        quantity=Decimal("1"),
        unit_price=Decimal("100"),
        discount_pct=Decimal("10"),
    )

    inv_no = Invoice(
        id="a",
        status=InvoiceStatus.DRAFT,
        issue_date=date(2026, 1, 1),
        client_id=None,
        lines=(line_nodiscount,),
    )
    inv_disc = Invoice(
        id="b",
        status=InvoiceStatus.DRAFT,
        issue_date=date(2026, 1, 1),
        client_id=None,
        lines=(line_discount,),
    )

    # Set official codes manually to allow hash computation
    object.__setattr__(inv_no,   "official_code", "2026-000001")
    object.__setattr__(inv_disc, "official_code", "2026-000001")

    hash_no   = inv_no.compute_integrity_hash()
    hash_disc = inv_disc.compute_integrity_hash()

    assert hash_no != hash_disc, "Discounted and non-discounted invoices must have different hashes"
