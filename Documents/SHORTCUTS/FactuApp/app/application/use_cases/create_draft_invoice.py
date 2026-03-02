from __future__ import annotations

from datetime import date
from uuid import uuid4

from app.domain.entities.invoice import Invoice
from app.domain.value_objects.invoice_status import InvoiceStatus


def create_draft_invoice(invoice_repo, lines: list, client_id: str | None, issue_date: date, notes: str | None, source_type: str, free_text_raw: str | None = None):
    invoice = Invoice(
        id=str(uuid4()),
        status=InvoiceStatus.DRAFT,
        issue_date=issue_date,
        client_id=client_id,
        lines=lines,
        notes=notes,
        source_type=source_type,
        free_text_raw=free_text_raw,
    )
    invoice.validate()
    invoice_repo.create(invoice)
    invoice_repo.append_event(invoice.id, "CREATED_DRAFT", {"source_type": source_type})
    return invoice
