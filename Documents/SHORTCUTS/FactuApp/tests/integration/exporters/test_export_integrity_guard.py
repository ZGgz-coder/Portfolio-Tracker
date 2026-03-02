from datetime import date

import pytest

from app.application.use_cases.create_draft_invoice import create_draft_invoice
from app.application.use_cases.create_special_invoice import create_special_invoice
from app.application.use_cases.export_invoice import export_invoice
from app.application.use_cases.officialize_invoice import officialize_invoice
from app.domain.entities.invoice import Invoice
from app.domain.rules.invoice_invariants import IntegrityViolationError
from app.infrastructure.exporters.excel_exporter_openpyxl import ExcelExporter
from app.infrastructure.storage.network_folder_storage import NetworkFolderStorage


def _line(desc: str, qty: str, price: str):
    return Invoice.create_line(desc, qty, price)


def test_export_blocked_when_integrity_hash_mismatch(conn, invoice_repo, numbering_repo, tmp_path, existing_client_id):
    draft = create_draft_invoice(
        invoice_repo=invoice_repo,
        lines=[_line("Instalacion", "1", "200")],
        client_id=existing_client_id,
        issue_date=date(2026, 2, 18),
        notes=None,
        source_type="MANUAL",
    )
    official = officialize_invoice(conn, invoice_repo, numbering_repo, draft.id)

    conn.execute("UPDATE invoice_lines SET unit_price = ? WHERE invoice_id = ?", ("999.00", official.id))

    with pytest.raises(IntegrityViolationError, match="Export blocked"):
        export_invoice(
            invoice_repo=invoice_repo,
            invoice_id=official.id,
            exporter=ExcelExporter(),
            storage=NetworkFolderStorage(root=tmp_path / "exports"),
            extension="xlsx",
        )

    events = invoice_repo.list_events(official.id)
    assert any(evt["event_type"] == "INTEGRITY_VIOLATION" for evt in events)


def test_validate_invoice_integrity_allows_draft_and_special_without_hash(conn, invoice_repo):
    draft = create_draft_invoice(
        invoice_repo=invoice_repo,
        lines=[_line("Revision", "1", "100")],
        client_id=None,
        issue_date=date(2026, 2, 18),
        notes=None,
        source_type="MANUAL",
    )
    special = create_special_invoice(
        invoice_repo=invoice_repo,
        lines=[_line("Presupuesto", "1", "100")],
        client_id=None,
        issue_date=date(2026, 2, 18),
        notes=None,
    )

    assert invoice_repo.validate_invoice_integrity(draft.id) is True
    assert invoice_repo.validate_invoice_integrity(special.id) is True
