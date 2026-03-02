from __future__ import annotations

from app.domain.rules.invoice_invariants import DomainError, NotFoundError
from app.domain.value_objects.invoice_status import InvoiceStatus
from app.infrastructure.db.transaction import immediate_transaction


def mark_invoice_paid(conn, invoice_repo, invoice_id: str):
    with immediate_transaction(conn):
        invoice = invoice_repo.get(invoice_id)
        if not invoice:
            raise NotFoundError("Invoice not found")
        if invoice.status != InvoiceStatus.OFFICIAL:
            raise DomainError("Only OFFICIAL invoices can be marked as paid")
        invoice.mark_paid()
        invoice_repo.update(invoice)
        invoice_repo.append_event(invoice.id, "PAID", {})
    return invoice
