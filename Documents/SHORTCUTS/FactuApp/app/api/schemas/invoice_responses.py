from pydantic import BaseModel


class InvoiceResponse(BaseModel):
    data: dict


class ExportResponse(BaseModel):
    invoice_id: str
    invoice_status: str
    export_status: str
    path: str | None = None
    error: str | None = None
