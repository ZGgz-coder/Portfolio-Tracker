from __future__ import annotations

from datetime import UTC, date, datetime
from decimal import Decimal
import json
import logging
import sqlite3
from uuid import uuid4

from app.domain.entities.invoice import Invoice
from app.domain.entities.invoice_line import InvoiceLine
from app.domain.rules.invoice_invariants import OfficialInvoiceImmutableError, RepositoryIntegrityError
from app.domain.value_objects.invoice_status import InvoiceStatus

logger = logging.getLogger(__name__)


class SQLiteInvoiceRepository:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def create(self, invoice: Invoice) -> None:
        now = datetime.now(UTC).isoformat()
        self.conn.execute(
            """
            INSERT INTO invoices (
                id, status, issue_date, client_id, series, fiscal_year, official_number, official_code,
                integrity_hash, subtotal, tax_rate, tax_amount, total, notes, source_type, free_text_raw,
                officialized_at, created_at, updated_at, rectifies_invoice_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                invoice.id,
                invoice.status.value,
                invoice.issue_date.isoformat(),
                invoice.client_id,
                invoice.series,
                invoice.fiscal_year,
                invoice.official_number,
                invoice.official_code,
                invoice.integrity_hash,
                str(invoice.subtotal),
                "0.21",
                str(invoice.tax_amount),
                str(invoice.total),
                invoice.notes,
                invoice.source_type,
                invoice.free_text_raw,
                invoice.officialized_at.isoformat() if invoice.officialized_at else None,
                now,
                now,
                invoice.rectifies_invoice_id,
            ),
        )
        self._replace_lines(invoice)

    def update(self, invoice: Invoice) -> None:
        current = self.get(invoice.id)
        if not current:
            raise RepositoryIntegrityError("Invoice not found for update")

        if current.status == InvoiceStatus.OFFICIAL and invoice.status == InvoiceStatus.PAID:
            # Allow OFFICIAL → PAID status change only; skip immutability checks
            pass
        elif current.status == InvoiceStatus.OFFICIAL:
            self._assert_official_update_allowed(current, invoice)

        now = datetime.now(UTC).isoformat()
        self.conn.execute(
            """
            UPDATE invoices SET
                status = ?,
                issue_date = ?,
                client_id = ?,
                series = ?,
                fiscal_year = ?,
                official_number = ?,
                official_code = ?,
                integrity_hash = ?,
                subtotal = ?,
                tax_rate = ?,
                tax_amount = ?,
                total = ?,
                notes = ?,
                source_type = ?,
                free_text_raw = ?,
                officialized_at = ?,
                updated_at = ?,
                rectifies_invoice_id = ?
            WHERE id = ?
            """,
            (
                invoice.status.value,
                invoice.issue_date.isoformat(),
                invoice.client_id,
                invoice.series,
                invoice.fiscal_year,
                invoice.official_number,
                invoice.official_code,
                invoice.integrity_hash,
                str(invoice.subtotal),
                "0.21",
                str(invoice.tax_amount),
                str(invoice.total),
                invoice.notes,
                invoice.source_type,
                invoice.free_text_raw,
                invoice.officialized_at.isoformat() if invoice.officialized_at else None,
                now,
                invoice.rectifies_invoice_id,
                invoice.id,
            ),
        )
        self._replace_lines(invoice)

    def get(self, invoice_id: str) -> Invoice | None:
        row = self.conn.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,)).fetchone()
        if not row:
            return None
        line_rows = self.conn.execute(
            "SELECT * FROM invoice_lines WHERE invoice_id = ? ORDER BY line_order",
            (invoice_id,),
        ).fetchall()
        lines = tuple(
            InvoiceLine(
                description=line["description"],
                quantity=Decimal(line["quantity"]),
                unit_price=Decimal(line["unit_price"]),
                tax_rate=Decimal(line["tax_rate"]),
                discount_pct=Decimal(line["discount_pct"]) if line["discount_pct"] else Decimal("0"),
            )
            for line in line_rows
        )
        return Invoice(
            id=row["id"],
            status=InvoiceStatus(row["status"]),
            issue_date=date.fromisoformat(row["issue_date"]),
            client_id=row["client_id"],
            lines=lines,
            series=row["series"],
            notes=row["notes"],
            source_type=row["source_type"],
            free_text_raw=row["free_text_raw"],
            fiscal_year=row["fiscal_year"],
            official_number=row["official_number"],
            official_code=row["official_code"],
            integrity_hash=row["integrity_hash"],
            officialized_at=datetime.fromisoformat(row["officialized_at"]) if row["officialized_at"] else None,
            rectifies_invoice_id=row["rectifies_invoice_id"] if row["rectifies_invoice_id"] else None,
        )

    _SORT_COLUMNS = {
        "issue_date": "issue_date",
        "official_code": "official_code",
        "subtotal": "CAST(subtotal AS REAL)",
        "tax_amount": "CAST(tax_amount AS REAL)",
        "total": "CAST(total AS REAL)",
    }

    def list(
        self,
        status: str | None = None,
        year: int | None = None,
        client_id: str | None = None,
        order_by: str | None = None,
        direction: str | None = None,
    ) -> list[Invoice]:
        query = "SELECT id FROM invoices WHERE 1=1"
        params: list[object] = []
        if status:
            query += " AND status = ?"
            params.append(status)
        if year is not None:
            query += " AND fiscal_year = ?"
            params.append(year)
        if client_id:
            query += " AND client_id = ?"
            params.append(client_id)
        sort_col = self._SORT_COLUMNS.get(order_by or "", "issue_date")
        sort_dir = "ASC" if (direction or "desc").upper() == "ASC" else "DESC"
        query += f" ORDER BY {sort_col} {sort_dir}"
        rows = self.conn.execute(query, tuple(params)).fetchall()
        result: list[Invoice] = []
        for row in rows:
            try:
                inv = self.get(row["id"])
                if inv is not None:
                    result.append(inv)
            except Exception as exc:  # noqa: BLE001
                logger.warning("Skipping invoice %s during list (domain error): %s", row["id"], exc)
        return result

    def append_event(self, invoice_id: str, event_type: str, payload: dict | None = None) -> None:
        self.conn.execute(
            "INSERT INTO invoice_events (id, invoice_id, event_type, event_payload, created_at) VALUES (?, ?, ?, ?, ?)",
            (str(uuid4()), invoice_id, event_type, json.dumps(payload or {}), datetime.now(UTC).isoformat()),
        )

    def list_events(self, invoice_id: str) -> list[dict]:
        rows = self.conn.execute(
            "SELECT event_type, event_payload, created_at FROM invoice_events WHERE invoice_id = ? ORDER BY created_at",
            (invoice_id,),
        ).fetchall()
        return [
            {
                "event_type": row["event_type"],
                "event_payload": json.loads(row["event_payload"] or "{}"),
                "created_at": row["created_at"],
            }
            for row in rows
        ]

    def validate_invoice_integrity(self, invoice_id: str) -> bool:
        invoice = self.get(invoice_id)
        if not invoice:
            raise RepositoryIntegrityError("Invoice not found for integrity validation")
        if invoice.status in {InvoiceStatus.DRAFT, InvoiceStatus.SPECIAL}:
            return True
        return invoice.verify_integrity()



    def _assert_official_update_allowed(self, current: Invoice, updated: Invoice) -> None:
        if updated.status != InvoiceStatus.OFFICIAL:
            raise OfficialInvoiceImmutableError("Cannot change OFFICIAL invoice status")

        immutable_checks = [
            ("issue_date", current.issue_date, updated.issue_date),
            ("client_id", current.client_id, updated.client_id),
            ("series", current.series, updated.series),
            ("fiscal_year", current.fiscal_year, updated.fiscal_year),
            ("official_number", current.official_number, updated.official_number),
            ("official_code", current.official_code, updated.official_code),
            ("integrity_hash", current.integrity_hash, updated.integrity_hash),
            ("lines", self._lines_signature(current), self._lines_signature(updated)),
            ("subtotal", str(current.subtotal), str(updated.subtotal)),
            ("tax_amount", str(current.tax_amount), str(updated.tax_amount)),
            ("total", str(current.total), str(updated.total)),
        ]
        for field_name, previous, candidate in immutable_checks:
            if previous != candidate:
                raise OfficialInvoiceImmutableError(f"Cannot modify OFFICIAL invoice field: {field_name}")

        if not updated.verify_integrity():
            raise RepositoryIntegrityError("OFFICIAL invoice integrity hash mismatch")

    @staticmethod
    def _lines_signature(invoice: Invoice) -> tuple[tuple[str, str, str, str, str, str], ...]:
        return tuple(
            (
                line.description,
                str(line.quantity),
                str(line.unit_price),
                str(line.line_subtotal),
                str(line.line_tax),
                str(line.line_total),
            )
            for line in invoice.lines
        )

    def _replace_lines(self, invoice: Invoice) -> None:
        self.conn.execute("DELETE FROM invoice_lines WHERE invoice_id = ?", (invoice.id,))
        for index, line in enumerate(invoice.lines, start=1):
            self.conn.execute(
                """
                INSERT INTO invoice_lines (
                    id, invoice_id, line_order, description, quantity, unit_price,
                    line_subtotal, tax_rate, line_tax, line_total, discount_pct
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid4()),
                    invoice.id,
                    index,
                    line.description,
                    str(line.quantity),
                    str(line.unit_price),
                    str(line.line_subtotal),
                    str(line.tax_rate),
                    str(line.line_tax),
                    str(line.line_total),
                    str(line.discount_pct),
                ),
            )
