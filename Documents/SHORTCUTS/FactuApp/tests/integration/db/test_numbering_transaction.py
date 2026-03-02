from datetime import date

import pytest

from app.application.use_cases.create_draft_invoice import create_draft_invoice
from app.application.use_cases.officialize_invoice import officialize_invoice
from app.domain.entities.invoice import Invoice


def _line(desc: str, qty: str, price: str):
    return Invoice.create_line(desc, qty, price)


def _create(conn, invoice_repo, issue_date, client_id: str):
    return create_draft_invoice(
        invoice_repo=invoice_repo,
        lines=[_line("Servicio", "1", "100")],
        client_id=client_id,
        issue_date=issue_date,
        notes=None,
        source_type="MANUAL",
    )


def test_correlative_numbering_without_gaps(conn, invoice_repo, numbering_repo, existing_client_id):
    inv1 = _create(conn, invoice_repo, date(2026, 1, 10), existing_client_id)
    inv2 = _create(conn, invoice_repo, date(2026, 1, 11), existing_client_id)

    off1 = officialize_invoice(conn, invoice_repo, numbering_repo, inv1.id)
    off2 = officialize_invoice(conn, invoice_repo, numbering_repo, inv2.id)

    assert off1.official_number == 1
    assert off2.official_number == 2


def test_numbering_resets_each_year(conn, invoice_repo, numbering_repo, existing_client_id):
    inv_2026 = _create(conn, invoice_repo, date(2026, 12, 31), existing_client_id)
    inv_2027 = _create(conn, invoice_repo, date(2027, 1, 1), existing_client_id)

    off_2026 = officialize_invoice(conn, invoice_repo, numbering_repo, inv_2026.id)
    off_2027 = officialize_invoice(conn, invoice_repo, numbering_repo, inv_2027.id)

    assert off_2026.official_number == 1
    assert off_2027.official_number == 1


def test_rollback_does_not_consume_number(conn, invoice_repo, numbering_repo, monkeypatch, existing_client_id):
    inv1 = _create(conn, invoice_repo, date(2026, 1, 10), existing_client_id)
    inv2 = _create(conn, invoice_repo, date(2026, 1, 11), existing_client_id)

    original_update = invoice_repo.update

    def failing_update(invoice):
        if invoice.id == inv1.id:
            raise RuntimeError("forced failure")
        return original_update(invoice)

    monkeypatch.setattr(invoice_repo, "update", failing_update)
    with pytest.raises(RuntimeError):
        officialize_invoice(conn, invoice_repo, numbering_repo, inv1.id)

    monkeypatch.setattr(invoice_repo, "update", original_update)
    off2 = officialize_invoice(conn, invoice_repo, numbering_repo, inv2.id)
    assert off2.official_number == 1
