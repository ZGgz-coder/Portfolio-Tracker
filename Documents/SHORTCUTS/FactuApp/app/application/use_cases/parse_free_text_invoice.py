from __future__ import annotations

from app.infrastructure.parser.natural_input_parser import parse_invoice_text


def parse_free_text_invoice(text: str):
    return parse_invoice_text(text)
