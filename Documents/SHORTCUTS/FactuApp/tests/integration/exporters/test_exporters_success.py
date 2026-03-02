from datetime import date

from app.application.use_cases.create_draft_invoice import create_draft_invoice
from app.application.use_cases.export_invoice import export_invoice
from app.application.use_cases.officialize_invoice import officialize_invoice
from app.domain.entities.invoice import Invoice
from app.infrastructure.exporters.excel_exporter_openpyxl import ExcelExporter
from app.infrastructure.exporters.pdf_exporter_reportlab import PdfExporter
from app.infrastructure.storage.network_folder_storage import NetworkFolderStorage


def _line(desc: str, qty: str, price: str):
    return Invoice.create_line(desc, qty, price)


def test_export_pdf_and_xlsx(conn, invoice_repo, numbering_repo, tmp_path, existing_client_id):
    draft = create_draft_invoice(
        invoice_repo=invoice_repo,
        lines=[_line("Instalacion", "1", "200")],
        client_id=existing_client_id,
        issue_date=date(2026, 2, 18),
        notes=None,
        source_type="MANUAL",
    )
    official = officialize_invoice(conn, invoice_repo, numbering_repo, draft.id)

    storage = NetworkFolderStorage(root=tmp_path / "exports")
    pdf_path = export_invoice(invoice_repo, official.id, PdfExporter(), storage, "pdf")
    xlsx_path = export_invoice(invoice_repo, official.id, ExcelExporter(), storage, "xlsx")

    assert pdf_path.exists()
    assert xlsx_path.exists()
    assert invoice_repo.validate_invoice_integrity(official.id) is True
