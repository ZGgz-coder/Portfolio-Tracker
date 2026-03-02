from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
import hashlib
from typing import ClassVar

from app.domain.entities.invoice_line import InvoiceLine
from app.domain.rules.invoice_invariants import (
    OfficialInvoiceImmutableError,
    OfficializationInvariantError,
    ensure_draft_editable,
    ensure_non_official_has_no_numbering,
    ensure_official_has_numbering,
)
from app.domain.services.invoice_state_machine import ensure_transition
from app.domain.value_objects.invoice_status import InvoiceStatus
from app.domain.value_objects.money import add, to_decimal


@dataclass(slots=True)
class Invoice:
    id: str
    status: InvoiceStatus
    issue_date: date
    client_id: str | None
    lines: tuple[InvoiceLine, ...]
    series: str = "A"
    notes: str | None = None
    source_type: str = "MANUAL"
    free_text_raw: str | None = None
    fiscal_year: int | None = None
    official_number: int | None = None
    official_code: str | None = None
    integrity_hash: str | None = None
    officialized_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    rectifies_invoice_id: str | None = None

    _protected_fields: ClassVar[tuple[str, ...]] = (
        "status",
        "issue_date",
        "client_id",
        "lines",
        "fiscal_year",
        "official_number",
        "official_code",
        "integrity_hash",
    )

    def __post_init__(self) -> None:
        object.__setattr__(self, "lines", tuple(self.lines))
        self.validate()

    def __setattr__(self, name: str, value):
        if (
            name in getattr(self, "_protected_fields", ())
            and getattr(self, "status", None) in {InvoiceStatus.OFFICIAL, InvoiceStatus.PAID}
            and hasattr(self, name)
            and getattr(self, name) != value
        ):
            raise OfficialInvoiceImmutableError(f"Cannot modify OFFICIAL invoice field: {name}")
        object.__setattr__(self, name, value)

    def validate(self) -> None:
        ensure_official_has_numbering(
            self.status,
            self.fiscal_year,
            self.official_number,
            self.official_code,
            self.integrity_hash,
        )
        ensure_non_official_has_no_numbering(
            self.status,
            self.fiscal_year,
            self.official_number,
            self.official_code,
            self.integrity_hash,
        )
        if not self.lines:
            raise OfficializationInvariantError("Invoice must contain at least one line")

    @property
    def subtotal(self) -> Decimal:
        return add([line.line_subtotal for line in self.lines])

    @property
    def tax_amount(self) -> Decimal:
        return add([line.line_tax for line in self.lines])

    @property
    def total(self) -> Decimal:
        return add([self.subtotal, self.tax_amount])

    def _serialized_lines_for_hash(self) -> str:
        return "||".join(
            f"{line.description}|{line.quantity}|{line.unit_price}|{line.line_subtotal}|{line.line_tax}|{line.line_total}"
            for line in self.lines
        )

    def compute_integrity_hash(self) -> str:
        if not self.official_code:
            raise OfficializationInvariantError("Cannot compute integrity hash without official code")
        payload = f"{self.official_code}|{self.subtotal}|{self.tax_amount}|{self.total}|{self._serialized_lines_for_hash()}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def verify_integrity(self) -> bool:
        if self.status not in {InvoiceStatus.OFFICIAL, InvoiceStatus.PAID} or not self.integrity_hash:
            return False
        return self.integrity_hash == self.compute_integrity_hash()

    def ensure_ready_for_officialization(self) -> None:
        if not self.client_id:
            raise OfficializationInvariantError("Cannot officialize invoice without client")
        if not self.lines:
            raise OfficializationInvariantError("Cannot officialize invoice without lines")
        if not self.rectifies_invoice_id and (
            self.subtotal < Decimal("0") or self.tax_amount < Decimal("0") or self.total < Decimal("0")
        ):
            raise OfficializationInvariantError("Cannot officialize invoice with negative totals")

        for line in self.lines:
            expected_line_total = add([line.line_subtotal, line.line_tax])
            if expected_line_total != line.line_total:
                raise OfficializationInvariantError("Invoice totals are inconsistent with invoice lines")

        recalculated_subtotal = add([line.line_subtotal for line in self.lines])
        recalculated_tax = add([line.line_tax for line in self.lines])
        recalculated_total = add([recalculated_subtotal, recalculated_tax])
        if recalculated_subtotal != self.subtotal or recalculated_tax != self.tax_amount or recalculated_total != self.total:
            raise OfficializationInvariantError("Invoice totals are inconsistent with invoice lines")

    def update_lines_and_notes(self, lines: list[InvoiceLine], notes: str | None) -> None:
        ensure_draft_editable(self.status)
        if not lines:
            raise OfficializationInvariantError("Invoice must contain at least one line")
        self.lines = tuple(lines)
        self.notes = notes

    def update_notes(self, notes: str | None) -> None:
        # Explicitly permitted non-fiscal metadata update.
        self.notes = notes

    def mark_official(self, fiscal_year: int, official_number: int, officialized_at: datetime) -> None:
        ensure_transition(self.status, InvoiceStatus.OFFICIAL)
        self.ensure_ready_for_officialization()
        self.fiscal_year = fiscal_year
        self.official_number = official_number
        self.official_code = f"{fiscal_year}-{official_number:06d}"
        self.officialized_at = officialized_at
        self.integrity_hash = self.compute_integrity_hash()
        self.status = InvoiceStatus.OFFICIAL
        self.validate()

    def mark_paid(self) -> None:
        ensure_transition(self.status, InvoiceStatus.PAID)
        object.__setattr__(self, "status", InvoiceStatus.PAID)

    @staticmethod
    def create_line(description: str, quantity: Decimal | str, unit_price: Decimal | str) -> InvoiceLine:
        return InvoiceLine(description=description, quantity=to_decimal(quantity), unit_price=to_decimal(unit_price))
