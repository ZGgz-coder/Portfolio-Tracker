from __future__ import annotations

from typing import Protocol


class NumberingRepository(Protocol):
    def get_next_number(self, fiscal_year: int, series: str) -> int: ...
