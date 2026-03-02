from datetime import date

import pytest

from app.application.use_cases.create_draft_invoice import create_draft_invoice
from app.application.use_cases.officialize_invoice import officialize_invoice
from app.application.use_cases.update_draft_invoice import update_draft_invoice
from app.domain.entities.invoice import Invoice
from app.domain.rules.invoice_invariants import DomainError, OfficialInvoiceImmutableError


def _line(desc: str, qty: str, price: str):
    return Invoice.create_line(desc, qty, price)


def test_no_number_assigned_until_officialize(invoice_repo, existing_client_id):
    inv = create_draft_invoice(
        invoice_repo=invoice_repo,
        lines=[_line("Revision", "1", "100")],
        client_id=existing_client_id,
        issue_date=date(2026, 2, 18),
        notes=None,
        source_type="MANUAL",
    )
    loaded = invoice_repo.get(inv.id)
    assert loaded is not None
    assert loaded.official_number is None


def test_only_draft_can_be_officialized(conn, invoice_repo, numbering_repo):
    from app.application.use_cases.create_special_invoice import create_special_invoice

    special = create_special_invoice(
        invoice_repo=invoice_repo,
        lines=[_line("Revision", "1", "100")],
        client_id=None,
        issue_date=date(2026, 2, 18),
        notes=None,
    )
    with pytest.raises(DomainError):
        officialize_invoice(conn, invoice_repo, numbering_repo, special.id)


def test_officialization_requires_client(conn, invoice_repo, numbering_repo):
    draft = create_draft_invoice(
        invoice_repo=invoice_repo,
        lines=[_line("Revision", "1", "100")],
        client_id=None,
        issue_date=date(2026, 2, 18),
        notes=None,
        source_type="MANUAL",
    )
    with pytest.raises(DomainError, match="without client"):
        officialize_invoice(conn, invoice_repo, numbering_repo, draft.id)


def test_application_guard_rejects_official_update(conn, invoice_repo, numbering_repo, existing_client_id):
    draft = create_draft_invoice(
        invoice_repo=invoice_repo,
        lines=[_line("Revision", "1", "100")],
        client_id=existing_client_id,
        issue_date=date(2026, 2, 18),
        notes=None,
        source_type="MANUAL",
    )
    official = officialize_invoice(conn, invoice_repo, numbering_repo, draft.id)
    with pytest.raises(OfficialInvoiceImmutableError):
        update_draft_invoice(invoice_repo, official.id, [_line("Nuevo", "1", "100")], "x")
