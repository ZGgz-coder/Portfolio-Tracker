from __future__ import annotations

from datetime import UTC, datetime

from app.domain.rules.invoice_invariants import DomainError, NotFoundError
from app.domain.value_objects.invoice_status import InvoiceStatus
from app.infrastructure.db.transaction import immediate_transaction


def officialize_invoice(conn, invoice_repo, numbering_repo, invoice_id: str):
    with immediate_transaction(conn):
        invoice = invoice_repo.get(invoice_id)
        if not invoice:
            raise NotFoundError("Invoice not found")
        if invoice.status != InvoiceStatus.DRAFT:
            raise DomainError("Only DRAFT invoices can be officialized")
        fiscal_year = invoice.issue_date.year
        next_number = numbering_repo.get_next_number(fiscal_year, invoice.series)
        invoice.mark_official(fiscal_year=fiscal_year, official_number=next_number, officialized_at=datetime.now(UTC))
        invoice_repo.update(invoice)
        invoice_repo.append_event(
            invoice.id,
            "OFFICIALIZED",
            {
                "fiscal_year": fiscal_year,
                "official_number": next_number,
                "official_code": invoice.official_code,
                "integrity_hash": invoice.integrity_hash,
            },
        )
    return invoice
