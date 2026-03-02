from __future__ import annotations

from app.domain.entities.invoice import Invoice


def calculate_totals(invoice: Invoice) -> dict[str, str]:
    return {
        "subtotal": str(invoice.subtotal),
        "tax_amount": str(invoice.tax_amount),
        "total": str(invoice.total),
    }
