from __future__ import annotations

from app.domain.entities.invoice import Invoice


def to_dict(invoice: Invoice) -> dict:
    return {
        "id": invoice.id,
        "status": invoice.status.value,
        "issue_date": invoice.issue_date.isoformat(),
        "client_id": invoice.client_id,
        "series": invoice.series,
        "fiscal_year": invoice.fiscal_year,
        "official_number": invoice.official_number,
        "official_code": invoice.official_code,
        "integrity_hash": invoice.integrity_hash,
        "subtotal": str(invoice.subtotal),
        "tax_amount": str(invoice.tax_amount),
        "total": str(invoice.total),
        "notes": invoice.notes,
        "source_type": invoice.source_type,
        "free_text_raw": invoice.free_text_raw,
        "rectifies_invoice_id": invoice.rectifies_invoice_id,
        "paid_at": None,
        "lines": [
            {
                "description": line.description,
                "quantity": str(line.quantity),
                "unit_price": str(line.unit_price),
                "line_subtotal": str(line.line_subtotal),
                "line_tax": str(line.line_tax),
                "line_total": str(line.line_total),
                "discount_pct": str(line.discount_pct),
            }
            for line in invoice.lines
        ],
    }
