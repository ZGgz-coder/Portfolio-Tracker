from __future__ import annotations

from datetime import UTC, datetime
import sqlite3

from app.domain.entities.client import Client


class SQLiteClientRepository:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def create(self, client: Client) -> None:
        now = datetime.now(UTC).isoformat()
        self.conn.execute(
            """
            INSERT INTO clients (id, name, tax_id, email, phone, address, city, postal_code, province, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                client.id,
                client.name,
                client.tax_id,
                client.email,
                client.phone,
                client.address,
                client.city,
                client.postal_code,
                client.province,
                now,
                now,
            ),
        )

    def update(self, client: Client) -> None:
        now = datetime.now(UTC).isoformat()
        self.conn.execute(
            """
            UPDATE clients
            SET name = ?, tax_id = ?, email = ?, phone = ?, address = ?, city = ?, postal_code = ?, province = ?, updated_at = ?
            WHERE id = ?
            """,
            (
                client.name,
                client.tax_id,
                client.email,
                client.phone,
                client.address,
                client.city,
                client.postal_code,
                client.province,
                now,
                client.id,
            ),
        )

    def get(self, client_id: str) -> Client | None:
        row = self.conn.execute("SELECT * FROM clients WHERE id = ?", (client_id,)).fetchone()
        if not row:
            return None
        return Client(
            id=row["id"],
            name=row["name"],
            tax_id=row["tax_id"],
            email=row["email"],
            phone=row["phone"],
            address=row["address"],
            city=row["city"],
            postal_code=row["postal_code"],
            province=row["province"],
        )

    def find_by_name_or_tax_id(self, value: str) -> Client | None:
        row = self.conn.execute(
            "SELECT * FROM clients WHERE tax_id = ? OR name LIKE ? ORDER BY name LIMIT 1",
            (value, f"%{value}%"),
        ).fetchone()
        if not row:
            return None
        return Client(
            id=row["id"],
            name=row["name"],
            tax_id=row["tax_id"],
            email=row["email"],
            phone=row["phone"],
            address=row["address"],
            city=row["city"],
            postal_code=row["postal_code"],
            province=row["province"],
        )

    def list(self, search: str | None = None) -> list[Client]:
        query = "SELECT * FROM clients WHERE 1=1"
        params: list[object] = []
        if search:
            like = f"%{search}%"
            query += " AND (name LIKE ? OR tax_id LIKE ?)"
            params.extend([like, like])
        query += " ORDER BY name"
        rows = self.conn.execute(query, tuple(params)).fetchall()
        return [
            Client(
                id=row["id"],
                name=row["name"],
                tax_id=row["tax_id"],
                email=row["email"],
                phone=row["phone"],
                address=row["address"],
                city=row["city"],
                postal_code=row["postal_code"],
                province=row["province"],
            )
            for row in rows
        ]
