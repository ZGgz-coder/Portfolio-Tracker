from __future__ import annotations

import os
from pathlib import Path
from uuid import uuid4

import pytest

from app.domain.entities.client import Client
from app.infrastructure.db.sqlite import get_connection, init_db
from app.infrastructure.db.repositories.sqlite_client_repository import SQLiteClientRepository
from app.infrastructure.db.repositories.sqlite_invoice_repository import SQLiteInvoiceRepository
from app.infrastructure.db.repositories.sqlite_numbering_repository import SQLiteNumberingRepository


@pytest.fixture()
def db_path(tmp_path: Path) -> str:
    return str(tmp_path / "test_factuapp.db")


@pytest.fixture()
def conn(db_path: str):
    init_db(db_path)
    connection = get_connection(db_path)
    yield connection
    connection.close()


@pytest.fixture()
def invoice_repo(conn):
    return SQLiteInvoiceRepository(conn)


@pytest.fixture()
def client_repo(conn):
    return SQLiteClientRepository(conn)


@pytest.fixture()
def numbering_repo(conn):
    return SQLiteNumberingRepository(conn)


@pytest.fixture()
def existing_client_id(client_repo):
    client_id = str(uuid4())
    client_repo.create(Client(id=client_id, name="Cliente Test", tax_id=f"B{client_id[:8]}"))
    return client_id
