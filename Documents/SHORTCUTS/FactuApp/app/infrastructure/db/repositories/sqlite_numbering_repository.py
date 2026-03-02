from __future__ import annotations

from datetime import UTC, datetime
import sqlite3


class SQLiteNumberingRepository:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def get_next_number(self, fiscal_year: int, series: str) -> int:
        row = self.conn.execute(
            "SELECT last_number FROM numbering_counters WHERE fiscal_year = ? AND series = ?",
            (fiscal_year, series),
        ).fetchone()
        now = datetime.now(UTC).isoformat()
        if not row:
            self.conn.execute(
                "INSERT INTO numbering_counters (fiscal_year, series, last_number, updated_at) VALUES (?, ?, ?, ?)",
                (fiscal_year, series, 1, now),
            )
            return 1

        next_number = int(row["last_number"]) + 1
        self.conn.execute(
            "UPDATE numbering_counters SET last_number = ?, updated_at = ? WHERE fiscal_year = ? AND series = ?",
            (next_number, now, fiscal_year, series),
        )
        return next_number
