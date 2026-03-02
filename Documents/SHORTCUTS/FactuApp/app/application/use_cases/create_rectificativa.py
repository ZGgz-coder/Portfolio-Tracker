from __future__ import annotations

from datetime import date
from uuid import uuid4

from app.domain.entities.invoice import Invoice
from app.domain.entities.invoice_line import InvoiceLine
from app.domain.rules.invoice_invariants import DomainError, NotFoundError
from app.domain.value_objects.invoice_status import InvoiceStatus


def create_rectificativa(invoice_repo, original_invoice_id: str) -> Invoice:
    original = invoice_repo.get(original_invoice_id)
    if not original:
        raise NotFoundError("Original invoice not found")
    if original.status not in {InvoiceStatus.OFFICIAL, InvoiceStatus.PAID}:
        raise DomainError("Only OFFICIAL or PAID invoices can be rectified")
    negated_lines = [
        InvoiceLine(
            description=f"[Rectificativa] {line.description}",
            quantity=-line.quantity,
            unit_price=line.unit_price,
            tax_rate=line.tax_rate,
            discount_pct=line.discount_pct,
        )
        for line in original.lines
    ]
    invoice = Invoice(
        id=str(uuid4()),
        status=InvoiceStatus.DRAFT,
        issue_date=date.today(),
        client_id=original.client_id,
        lines=tuple(negated_lines),
        series=original.series,
        notes=f"Rectificativa de factura {original.official_code or original_invoice_id}",
        rectifies_invoice_id=original_invoice_id,
    )
    invoice_repo.create(invoice)
    return invoice
