from __future__ import annotations

from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import create_app


def _create_client(http):
    r = http.post("/api/clients", json={"name": "Rectif Client", "tax_id": f"B{uuid4().hex[:8]}"})
    assert r.status_code == 200
    return r.json()["data"]["id"]


def _create_and_officialize(http, client_id):
    r = http.post(
        "/api/invoices/drafts/manual",
        json={
            "client_id": client_id,
            "issue_date": "2026-02-01",
            "lines": [{"description": "Servicio A", "quantity": "2", "unit_price": "50"}],
        },
    )
    assert r.status_code == 200
    invoice_id = r.json()["data"]["id"]

    r2 = http.post(f"/api/invoices/{invoice_id}/officialize")
    assert r2.status_code == 200
    return invoice_id


def test_create_rectificativa_from_official(tmp_path, monkeypatch):
    monkeypatch.setenv("FACTUAPP_DB_PATH", str(tmp_path / "rect1.db"))
    monkeypatch.setenv("FACTUAPP_EXPORT_ROOT", str(tmp_path / "exports"))

    app = create_app()
    http = TestClient(app)

    client_id = _create_client(http)
    invoice_id = _create_and_officialize(http, client_id)

    r = http.post(f"/api/invoices/{invoice_id}/rectificativa")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["status"] == "DRAFT"
    assert data["rectifies_invoice_id"] == invoice_id
    assert len(data["lines"]) == 1
    assert float(data["lines"][0]["quantity"]) == -2.0


def test_officialize_rectificativa(tmp_path, monkeypatch):
    monkeypatch.setenv("FACTUAPP_DB_PATH", str(tmp_path / "rect2.db"))
    monkeypatch.setenv("FACTUAPP_EXPORT_ROOT", str(tmp_path / "exports"))

    app = create_app()
    http = TestClient(app)

    client_id = _create_client(http)
    invoice_id = _create_and_officialize(http, client_id)

    r = http.post(f"/api/invoices/{invoice_id}/rectificativa")
    rect_id = r.json()["data"]["id"]

    r2 = http.post(f"/api/invoices/{rect_id}/officialize")
    assert r2.status_code == 200
    data = r2.json()["data"]
    assert data["status"] == "OFFICIAL"
    assert data["official_code"] is not None


def test_cannot_rectify_draft(tmp_path, monkeypatch):
    monkeypatch.setenv("FACTUAPP_DB_PATH", str(tmp_path / "rect3.db"))
    monkeypatch.setenv("FACTUAPP_EXPORT_ROOT", str(tmp_path / "exports"))

    app = create_app()
    http = TestClient(app)

    r = http.post(
        "/api/invoices/drafts/manual",
        json={
            "client_id": None,
            "issue_date": "2026-02-01",
            "lines": [{"description": "Draft line", "quantity": "1", "unit_price": "10"}],
        },
    )
    draft_id = r.json()["data"]["id"]

    r2 = http.post(f"/api/invoices/{draft_id}/rectificativa")
    assert r2.status_code in (400, 422)
