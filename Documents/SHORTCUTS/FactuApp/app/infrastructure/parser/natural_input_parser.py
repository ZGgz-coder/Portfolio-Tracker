from __future__ import annotations

import re
from decimal import Decimal

from app.domain.entities.invoice import Invoice
from app.domain.entities.invoice_line import InvoiceLine
from app.domain.value_objects.money import to_decimal
from app.infrastructure.parser.regex_patterns import CLIENT_PATTERN, LINE_PATTERN


class ParseResult:
    def __init__(self, client_hint: str | None, lines: list[InvoiceLine], warnings: list[str]):
        self.client_hint = client_hint
        self.lines = lines
        self.warnings = warnings


def _normalize_number(raw: str) -> Decimal:
    normalized = raw.strip().replace(".", "").replace(",", ".")
    return to_decimal(normalized)


def parse_invoice_text(text: str) -> ParseResult:
    warnings: list[str] = []
    client_match = re.search(CLIENT_PATTERN, text, flags=re.IGNORECASE)
    client_hint = client_match.group(1).strip() if client_match else None

    lines: list[InvoiceLine] = []
    for match in re.finditer(LINE_PATTERN, text, flags=re.IGNORECASE):
        desc = match.group("desc").strip()
        qty = _normalize_number(match.group("qty"))
        price = _normalize_number(match.group("price"))
        lines.append(Invoice.create_line(desc, qty, price))

    if not lines:
        warnings.append("No invoice lines could be extracted")

    if not client_hint:
        warnings.append("Client could not be detected")

    return ParseResult(client_hint=client_hint, lines=lines, warnings=warnings)
