from __future__ import annotations

from app.domain.rules.invoice_invariants import (
    DomainError,
    ExportOperationalError,
    IntegrityViolationError,
    NotFoundError,
)


def export_invoice(invoice_repo, invoice_id: str, exporter, storage, extension: str):
    invoice = invoice_repo.get(invoice_id)
    if not invoice:
        raise NotFoundError("Invoice not found")
    if invoice.status.value not in {"OFFICIAL", "SPECIAL"}:
        raise DomainError("Only OFFICIAL or SPECIAL invoices can be exported")
    if not invoice_repo.validate_invoice_integrity(invoice_id):
        invoice_repo.append_event(
            invoice_id,
            "INTEGRITY_VIOLATION",
            {"reason": "Hash mismatch detected before export", "extension": extension},
        )
        raise IntegrityViolationError("Invoice integrity verification failed. Export blocked.")

    content = exporter.render(invoice)
    year = invoice.fiscal_year or invoice.issue_date.year
    filename = f"{invoice.official_code}.{extension}"
    relative_path = f"{year}/OFFICIAL/{filename}"

    try:
        stored_path = storage.write_bytes(relative_path, content)
        invoice_repo.append_event(invoice.id, f"EXPORTED_{extension.upper()}", {"path": str(stored_path)})
        return stored_path
    except Exception as exc:
        invoice_repo.append_event(invoice.id, "EXPORT_FAILED", {"extension": extension, "error": str(exc)})
        raise ExportOperationalError("Export storage operation failed") from exc
