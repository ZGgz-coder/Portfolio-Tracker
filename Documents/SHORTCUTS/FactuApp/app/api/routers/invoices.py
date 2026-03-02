from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.api.deps import get_client_repo, get_conn, get_invoice_repo, get_numbering_repo
from app.api.schemas.invoice_requests import (
    CreateDraftFreeTextRequest,
    CreateDraftManualRequest,
    CreateSpecialRequest,
    UpdateDraftRequest,
)
from app.application.dto.invoice_dto import to_dict
from app.application.use_cases.create_draft_invoice import create_draft_invoice
from app.application.use_cases.create_rectificativa import create_rectificativa as _create_rectificativa
from app.application.use_cases.create_special_invoice import create_special_invoice
from app.application.use_cases.export_invoice import export_invoice
from app.application.use_cases.mark_invoice_paid import mark_invoice_paid
from app.application.use_cases.officialize_invoice import officialize_invoice
from app.application.use_cases.parse_free_text_invoice import parse_free_text_invoice
from app.application.use_cases.update_draft_invoice import update_draft_invoice
from app.domain.entities.invoice import Invoice
from app.domain.rules.invoice_invariants import NotFoundError
from app.infrastructure.exporters.excel_exporter_openpyxl import ExcelExporter
from app.infrastructure.exporters.pdf_exporter_reportlab import PdfExporter
from app.infrastructure.storage.network_folder_storage import NetworkFolderStorage

router = APIRouter(prefix="/api/invoices", tags=["invoices"])


def _to_lines(lines_input):
    from decimal import Decimal
    from app.domain.entities.invoice_line import InvoiceLine
    from app.domain.value_objects.money import to_decimal
    return [
        InvoiceLine(
            description=line.description,
            quantity=to_decimal(line.quantity),
            unit_price=to_decimal(line.unit_price),
            discount_pct=Decimal(line.discount_pct),
        )
        for line in lines_input
    ]


@router.post("/drafts/manual")
def create_draft_manual(payload: CreateDraftManualRequest, conn=Depends(get_conn)):
    repo = get_invoice_repo(conn)
    invoice = create_draft_invoice(
        invoice_repo=repo,
        lines=_to_lines(payload.lines),
        client_id=payload.client_id,
        issue_date=date.fromisoformat(payload.issue_date),
        notes=payload.notes,
        source_type="MANUAL",
    )
    return {"data": to_dict(invoice)}


@router.post("/drafts/free-text")
def create_draft_free_text(payload: CreateDraftFreeTextRequest, conn=Depends(get_conn)):
    repo = get_invoice_repo(conn)
    parsed = parse_free_text_invoice(payload.text)
    invoice = create_draft_invoice(
        invoice_repo=repo,
        lines=parsed.lines,
        client_id=None,
        issue_date=date.fromisoformat(payload.issue_date),
        notes=payload.notes,
        source_type="FREE_TEXT",
        free_text_raw=payload.text,
    )
    return {"data": to_dict(invoice), "warnings": parsed.warnings, "client_hint": parsed.client_hint}


@router.put("/drafts/{invoice_id}")
def update_draft(invoice_id: str, payload: UpdateDraftRequest, conn=Depends(get_conn)):
    repo = get_invoice_repo(conn)
    invoice = update_draft_invoice(repo, invoice_id, _to_lines(payload.lines), payload.notes)
    return {"data": to_dict(invoice)}


@router.post("/{invoice_id}/officialize")
def officialize(invoice_id: str, conn=Depends(get_conn)):
    invoice_repo = get_invoice_repo(conn)
    numbering_repo = get_numbering_repo(conn)
    invoice = officialize_invoice(conn, invoice_repo, numbering_repo, invoice_id)
    return {"data": to_dict(invoice)}


@router.post("/{invoice_id}/mark-paid")
def mark_paid(invoice_id: str, conn=Depends(get_conn)):
    invoice = mark_invoice_paid(conn, get_invoice_repo(conn), invoice_id)
    return {"data": to_dict(invoice)}


@router.post("/{invoice_id}/rectificativa")
def create_rectificativa_endpoint(invoice_id: str, conn=Depends(get_conn)):
    invoice = _create_rectificativa(get_invoice_repo(conn), invoice_id)
    return {"data": to_dict(invoice)}


@router.post("/special")
def create_special(payload: CreateSpecialRequest, conn=Depends(get_conn)):
    repo = get_invoice_repo(conn)
    invoice = create_special_invoice(
        invoice_repo=repo,
        lines=_to_lines(payload.lines),
        client_id=payload.client_id,
        issue_date=date.fromisoformat(payload.issue_date),
        notes=payload.notes,
    )
    return {"data": to_dict(invoice)}


@router.get("/{invoice_id}")
def get_invoice(invoice_id: str, conn=Depends(get_conn)):
    repo = get_invoice_repo(conn)
    invoice = repo.get(invoice_id)
    if not invoice:
        raise NotFoundError("Invoice not found")
    return {"data": to_dict(invoice)}


@router.get("")
def list_invoices(
    status: str | None = None,
    year: int | None = None,
    client: str | None = None,
    order_by: str | None = None,
    direction: str | None = None,
    conn=Depends(get_conn),
):
    repo = get_invoice_repo(conn)
    invoices = repo.list(status=status, year=year, client_id=client, order_by=order_by, direction=direction)
    return {"data": [to_dict(i) for i in invoices]}


def _export(invoice_id: str, conn, extension: str) -> StreamingResponse:
    repo = get_invoice_repo(conn)
    client_repo = get_client_repo(conn)
    exporter = (
        PdfExporter(client_resolver=client_repo.get)
        if extension == "pdf"
        else ExcelExporter(client_resolver=client_repo.get)
    )
    # Save to disk (raises on integrity/domain errors)
    export_invoice(repo, invoice_id, exporter, NetworkFolderStorage(), extension)
    # Re-render for streaming response (export_invoice already validated the invoice)
    invoice = repo.get(invoice_id)
    if not invoice:
        raise NotFoundError("Invoice not found")
    content = exporter.render(invoice)
    name = invoice.official_code or invoice_id
    if extension == "pdf":
        media_type = "application/pdf"
        disposition = f"inline; filename={name}.pdf"
    else:
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        disposition = f"attachment; filename={name}.xlsx"
    return StreamingResponse(
        iter([content]),
        media_type=media_type,
        headers={"Content-Disposition": disposition},
    )


@router.post("/{invoice_id}/export/pdf")
def export_pdf(invoice_id: str, conn=Depends(get_conn)):
    return _export(invoice_id, conn, "pdf")


@router.post("/{invoice_id}/export/xlsx")
def export_xlsx(invoice_id: str, conn=Depends(get_conn)):
    return _export(invoice_id, conn, "xlsx")


def _download(invoice_id: str, conn, extension: str) -> StreamingResponse:
    repo = get_invoice_repo(conn)
    client_repo = get_client_repo(conn)
    invoice = repo.get(invoice_id)
    if not invoice:
        raise NotFoundError("Invoice not found")
    if invoice.status.value not in {"OFFICIAL", "SPECIAL", "PAID"}:
        raise NotFoundError("Only OFFICIAL, SPECIAL or PAID invoices can be downloaded")
    exporter = (
        PdfExporter(client_resolver=client_repo.get)
        if extension == "pdf"
        else ExcelExporter(client_resolver=client_repo.get)
    )
    content = exporter.render(invoice)
    name = invoice.official_code or invoice_id
    if extension == "pdf":
        media_type = "application/pdf"
        disposition = f"inline; filename={name}.pdf"
    else:
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        disposition = f"attachment; filename={name}.xlsx"
    return StreamingResponse(
        iter([content]),
        media_type=media_type,
        headers={"Content-Disposition": disposition},
    )


@router.get("/{invoice_id}/download/pdf")
def download_pdf(invoice_id: str, conn=Depends(get_conn)):
    return _download(invoice_id, conn, "pdf")


@router.get("/{invoice_id}/download/xlsx")
def download_xlsx(invoice_id: str, conn=Depends(get_conn)):
    return _download(invoice_id, conn, "xlsx")
