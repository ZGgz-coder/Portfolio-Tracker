from datetime import date

import pytest

from app.application.use_cases.create_draft_invoice import create_draft_invoice
from app.application.use_cases.officialize_invoice import officialize_invoice
from app.domain.entities.invoice import Invoice
from app.domain.rules.invoice_invariants import OfficialInvoiceImmutableError


def _line(desc: str, qty: str, price: str):
    return Invoice.create_line(desc, qty, price)


def test_repository_blocks_official_fiscal_mutation(conn, invoice_repo, numbering_repo, existing_client_id):
    draft = create_draft_invoice(
        invoice_repo=invoice_repo,
        lines=[_line("Servicio", "1", "100")],
        client_id=existing_client_id,
        issue_date=date(2026, 2, 18),
        notes=None,
        source_type="MANUAL",
    )
    official = officialize_invoice(conn, invoice_repo, numbering_repo, draft.id)

    tampered = invoice_repo.get(official.id)
    assert tampered is not None
    object.__setattr__(tampered, "client_id", "other-client")

    with pytest.raises(OfficialInvoiceImmutableError):
        invoice_repo.update(tampered)


def test_repository_allows_explicit_official_metadata_update(conn, invoice_repo, numbering_repo, existing_client_id):
    draft = create_draft_invoice(
        invoice_repo=invoice_repo,
        lines=[_line("Servicio", "1", "100")],
        client_id=existing_client_id,
        issue_date=date(2026, 2, 18),
        notes=None,
        source_type="MANUAL",
    )
    official = officialize_invoice(conn, invoice_repo, numbering_repo, draft.id)

    updated = invoice_repo.get(official.id)
    assert updated is not None
    updated.update_notes("observacion interna")
    invoice_repo.update(updated)

    persisted = invoice_repo.get(official.id)
    assert persisted is not None
    assert persisted.notes == "observacion interna"
    assert persisted.verify_integrity() is True
