from pydantic import BaseModel, Field


class InvoiceLineInput(BaseModel):
    description: str
    quantity: str
    unit_price: str
    discount_pct: str = "0"


class CreateDraftManualRequest(BaseModel):
    client_id: str | None = None
    issue_date: str
    notes: str | None = None
    lines: list[InvoiceLineInput]


class CreateDraftFreeTextRequest(BaseModel):
    issue_date: str
    notes: str | None = None
    text: str


class UpdateDraftRequest(BaseModel):
    notes: str | None = None
    lines: list[InvoiceLineInput]


class CreateSpecialRequest(BaseModel):
    client_id: str | None = None
    issue_date: str
    notes: str | None = None
    lines: list[InvoiceLineInput]
