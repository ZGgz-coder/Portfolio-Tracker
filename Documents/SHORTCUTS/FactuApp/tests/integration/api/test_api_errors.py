from datetime import date
from uuid import uuid4

from fastapi.testclient import TestClient

from app.application.use_cases.create_draft_invoice import create_draft_invoice
from app.application.use_cases.officialize_invoice import officialize_invoice
from app.domain.entities.invoice import Invoice
from app.main import create_app


def _line(desc: str, qty: str, price: str):
    return Invoice.create_line(desc, qty, price)


def _create_client(client: TestClient) -> str:
    response = client.post(
        "/api/clients",
        json={"name": "Cliente API", "tax_id": f"B{uuid4().hex[:8]}"},
    )
    assert response.status_code == 200
    return response.json()["data"]["id"]


def test_not_found_returns_404_with_error_shape(tmp_path, monkeypatch):
    monkeypatch.setenv("FACTUAPP_DB_PATH", str(tmp_path / "api-notfound.db"))
    monkeypatch.setenv("FACTUAPP_EXPORT_ROOT", str(tmp_path / "exports"))

    client = TestClient(create_app())
    response = client.get("/api/invoices/non-existent")
    assert response.status_code == 404
    body = response.json()
    assert set(body.keys()) == {"code", "message", "details"}
    assert body["code"] == "NOT_FOUND"


def test_domain_error_returns_400_with_error_shape(tmp_path, monkeypatch):
    monkeypatch.setenv("FACTUAPP_DB_PATH", str(tmp_path / "api-domain.db"))
    monkeypatch.setenv("FACTUAPP_EXPORT_ROOT", str(tmp_path / "exports"))

    client = TestClient(create_app())
    response = client.post(
        "/api/invoices/drafts/manual",
        json={"issue_date": "2026-02-18", "notes": None, "lines": []},
    )
    assert response.status_code == 400
    body = response.json()
    assert set(body.keys()) == {"code", "message", "details"}
    assert body["code"] == "DOMAIN_ERROR"


def test_export_integrity_violation_returns_409(tmp_path, monkeypatch):
    db_path = tmp_path / "api-integrity.db"
    monkeypatch.setenv("FACTUAPP_DB_PATH", str(db_path))
    monkeypatch.setenv("FACTUAPP_EXPORT_ROOT", str(tmp_path / "exports"))

    app = create_app()
    client = TestClient(app)
    client_id = _create_client(client)

    draft_response = client.post(
        "/api/invoices/drafts/manual",
        json={
            "client_id": client_id,
            "issue_date": "2026-02-18",
            "notes": None,
            "lines": [{"description": "Servicio", "quantity": "1", "unit_price": "100"}],
        },
    )
    invoice_id = draft_response.json()["data"]["id"]
    client.post(f"/api/invoices/{invoice_id}/officialize")

    from app.infrastructure.db.sqlite import get_connection

    conn = get_connection()
    conn.execute("UPDATE invoice_lines SET unit_price = ? WHERE invoice_id = ?", ("999.00", invoice_id))
    conn.close()

    export_response = client.post(f"/api/invoices/{invoice_id}/export/xlsx")
    assert export_response.status_code == 409
    body = export_response.json()
    assert body["code"] == "INTEGRITY_VIOLATION"


def test_export_network_failure_returns_503_and_invoice_stays_official(tmp_path, monkeypatch):
    db_path = tmp_path / "api-network.db"
    monkeypatch.setenv("FACTUAPP_DB_PATH", str(db_path))
    monkeypatch.setenv("FACTUAPP_EXPORT_ROOT", str(tmp_path / "exports"))

    app = create_app()
    client = TestClient(app)
    client_id = _create_client(client)

    draft_response = client.post(
        "/api/invoices/drafts/manual",
        json={
            "client_id": client_id,
            "issue_date": "2026-02-18",
            "notes": None,
            "lines": [{"description": "Servicio", "quantity": "1", "unit_price": "100"}],
        },
    )
    invoice_id = draft_response.json()["data"]["id"]
    client.post(f"/api/invoices/{invoice_id}/officialize")

    from app.infrastructure.storage.network_folder_storage import NetworkFolderStorage

    original = NetworkFolderStorage.write_bytes

    def failing_write(self, relative_path: str, content: bytes):
        raise OSError("network folder unavailable")

    NetworkFolderStorage.write_bytes = failing_write  # type: ignore[assignment]
    try:
        export_response = client.post(f"/api/invoices/{invoice_id}/export/pdf")
    finally:
        NetworkFolderStorage.write_bytes = original  # type: ignore[assignment]

    assert export_response.status_code == 503
    body = export_response.json()
    assert body["code"] == "EXPORT_UNAVAILABLE"

    invoice_response = client.get(f"/api/invoices/{invoice_id}")
    assert invoice_response.status_code == 200
    assert invoice_response.json()["data"]["status"] == "OFFICIAL"
