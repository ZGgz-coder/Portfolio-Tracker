from __future__ import annotations

from contextlib import contextmanager
import sqlite3


@contextmanager
def immediate_transaction(conn: sqlite3.Connection):
    conn.execute("BEGIN IMMEDIATE")
    try:
        yield
        conn.execute("COMMIT")
    except Exception:
        conn.execute("ROLLBACK")
        raise
