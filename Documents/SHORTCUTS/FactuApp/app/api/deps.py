from __future__ import annotations

from collections.abc import Generator

from app.infrastructure.db.repositories.sqlite_client_repository import SQLiteClientRepository
from app.infrastructure.db.repositories.sqlite_invoice_repository import SQLiteInvoiceRepository
from app.infrastructure.db.repositories.sqlite_numbering_repository import SQLiteNumberingRepository
from app.infrastructure.db.sqlite import get_connection


def get_conn() -> Generator:
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


def get_invoice_repo(conn):
    return SQLiteInvoiceRepository(conn)


def get_client_repo(conn):
    return SQLiteClientRepository(conn)


def get_numbering_repo(conn):
    return SQLiteNumberingRepository(conn)
