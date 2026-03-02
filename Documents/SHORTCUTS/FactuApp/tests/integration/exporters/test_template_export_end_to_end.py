from datetime import date

from app.application.use_cases.create_draft_invoice import create_draft_invoice
from app.application.use_cases.export_invoice import export_invoice
from app.application.use_cases.officialize_invoice import officialize_invoice
from app.domain.entities.invoice import Invoice
from app.infrastructure.exporters.excel_exporter_openpyxl import ExcelExporter
from app.infrastructure.exporters.pro_template_generator import generate_pro_template
from app.infrastructure.storage.network_folder_storage import NetworkFolderStorage


def _line(desc: str, qty: str, price: str):
    return Invoice.create_line(desc, qty, price)


def test_template_export_with_pro_end_to_end(conn, invoice_repo, numbering_repo, tmp_path, existing_client_id):
    generate_pro_template(tmp_path)

    draft = create_draft_invoice(
        invoice_repo=invoice_repo,
        lines=[_line("Instalacion", "1", "200")],
        client_id=existing_client_id,
        issue_date=date(2026, 2, 18),
        notes=None,
        source_type="MANUAL",
    )
    official = officialize_invoice(conn, invoice_repo, numbering_repo, draft.id)

    exporter = ExcelExporter(export_mode="template", export_template="pro", project_root=tmp_path)
    storage = NetworkFolderStorage(root=tmp_path / "exports")
    path = export_invoice(invoice_repo, official.id, exporter, storage, "xlsx")
    assert path.exists()
