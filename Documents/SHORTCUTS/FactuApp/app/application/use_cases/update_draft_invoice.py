from __future__ import annotations

from app.domain.rules.invoice_invariants import NotFoundError, OfficialInvoiceImmutableError
from app.domain.value_objects.invoice_status import InvoiceStatus


def update_draft_invoice(invoice_repo, invoice_id: str, lines: list, notes: str | None):
    invoice = invoice_repo.get(invoice_id)
    if not invoice:
        raise NotFoundError("Invoice not found")
    if invoice.status == InvoiceStatus.OFFICIAL:
        raise OfficialInvoiceImmutableError("Cannot modify OFFICIAL invoice")
    invoice.update_lines_and_notes(lines, notes)
    invoice.validate()
    invoice_repo.update(invoice)
    invoice_repo.append_event(invoice.id, "UPDATED_DRAFT", {})
    return invoice
