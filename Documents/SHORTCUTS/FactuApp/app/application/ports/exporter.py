from __future__ import annotations

from typing import Protocol

from app.domain.entities.invoice import Invoice


class Exporter(Protocol):
    def render(self, invoice: Invoice) -> bytes: ...
