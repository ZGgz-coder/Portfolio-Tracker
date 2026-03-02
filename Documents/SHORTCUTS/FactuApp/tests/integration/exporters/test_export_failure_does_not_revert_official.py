from datetime import date

import pytest

from app.application.use_cases.create_draft_invoice import create_draft_invoice
from app.application.use_cases.export_invoice import export_invoice
from app.application.use_cases.officialize_invoice import officialize_invoice
from app.domain.entities.invoice import Invoice
from app.domain.rules.invoice_invariants import ExportOperationalError
from app.infrastructure.exporters.excel_exporter_openpyxl import ExcelExporter


class FailingStorage:
    def write_bytes(self, relative_path: str, content: bytes):
        raise OSError("network folder unavailable")


def _line(desc: str, qty: str, price: str):
    return Invoice.create_line(desc, qty, price)


def test_export_failure_keeps_invoice_official_and_logs_event(conn, invoice_repo, numbering_repo, existing_client_id):
    draft = create_draft_invoice(
        invoice_repo=invoice_repo,
        lines=[_line("Instalacion", "1", "150")],
        client_id=existing_client_id,
        issue_date=date(2026, 2, 18),
        notes=None,
        source_type="MANUAL",
    )
    official = officialize_invoice(conn, invoice_repo, numbering_repo, draft.id)

    with pytest.raises(ExportOperationalError):
        export_invoice(
            invoice_repo=invoice_repo,
            invoice_id=official.id,
            exporter=ExcelExporter(),
            storage=FailingStorage(),
            extension="xlsx",
        )

    loaded = invoice_repo.get(official.id)
    assert loaded is not None
    assert loaded.status.value == "OFFICIAL"
    assert loaded.official_number == 1
    events = invoice_repo.list_events(official.id)
    assert any(evt["event_type"] == "EXPORT_FAILED" for evt in events)
