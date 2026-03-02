from datetime import date
from uuid import uuid4

from app.domain.entities.client import Client
from app.infrastructure.db.sqlite import get_connection, init_db
from app.infrastructure.db.repositories.sqlite_client_repository import SQLiteClientRepository


if __name__ == "__main__":
    init_db()
    conn = get_connection()
    repo = SQLiteClientRepository(conn)
    repo.create(Client(id=str(uuid4()), name="Cliente Demo Climatizacion", tax_id="B12345678"))
    conn.close()
    print("Demo data seeded")
