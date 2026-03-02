from __future__ import annotations

from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import create_app


def _make_app(tmp_path):
    import os
    os.environ["FACTUAPP_DB_PATH"] = str(tmp_path / "test.db")
    os.environ["FACTUAPP_EXPORT_ROOT"] = str(tmp_path / "exports")
    return create_app()


def _create_client(http):
    r = http.post("/api/clients", json={"name": "Test Client", "tax_id": f"B{uuid4().hex[:8]}"})
    assert r.status_code == 200
    return r.json()["data"]["id"]


def _create_and_officialize(http, client_id):
    r = http.post(
        "/api/invoices/drafts/manual",
        json={
            "client_id": client_id,
            "issue_date": "2026-01-15",
            "lines": [{"description": "Servicio", "quantity": "1", "unit_price": "100"}],
        },
    )
    assert r.status_code == 200
    invoice_id = r.json()["data"]["id"]

    r2 = http.post(f"/api/invoices/{invoice_id}/officialize")
    assert r2.status_code == 200
    assert r2.json()["data"]["status"] == "OFFICIAL"
    return invoice_id


def test_mark_official_then_paid(tmp_path, monkeypatch):
    monkeypatch.setenv("FACTUAPP_DB_PATH", str(tmp_path / "paid.db"))
    monkeypatch.setenv("FACTUAPP_EXPORT_ROOT", str(tmp_path / "exports"))

    app = create_app()
    http = TestClient(app)

    client_id = _create_client(http)
    invoice_id = _create_and_officialize(http, client_id)

    r = http.post(f"/api/invoices/{invoice_id}/mark-paid")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["status"] == "PAID"
    assert data["official_code"] is not None
    assert data["integrity_hash"] is not None


def test_cannot_mark_draft_as_paid(tmp_path, monkeypatch):
    monkeypatch.setenv("FACTUAPP_DB_PATH", str(tmp_path / "paid2.db"))
    monkeypatch.setenv("FACTUAPP_EXPORT_ROOT", str(tmp_path / "exports"))

    app = create_app()
    http = TestClient(app)

    r = http.post(
        "/api/invoices/drafts/manual",
        json={
            "client_id": None,
            "issue_date": "2026-01-15",
            "lines": [{"description": "X", "quantity": "1", "unit_price": "50"}],
        },
    )
    invoice_id = r.json()["data"]["id"]

    r2 = http.post(f"/api/invoices/{invoice_id}/mark-paid")
    assert r2.status_code in (400, 422)


def test_paid_invoice_is_downloadable(tmp_path, monkeypatch):
    monkeypatch.setenv("FACTUAPP_DB_PATH", str(tmp_path / "paid3.db"))
    monkeypatch.setenv("FACTUAPP_EXPORT_ROOT", str(tmp_path / "exports"))

    app = create_app()
    http = TestClient(app)

    client_id = _create_client(http)
    invoice_id = _create_and_officialize(http, client_id)

    http.post(f"/api/invoices/{invoice_id}/mark-paid")

    r = http.get(f"/api/invoices/{invoice_id}/download/pdf")
    assert r.status_code == 200
    assert r.content[:4] == b"%PDF"


def test_discount_on_line(tmp_path, monkeypatch):
    monkeypatch.setenv("FACTUAPP_DB_PATH", str(tmp_path / "disc.db"))
    monkeypatch.setenv("FACTUAPP_EXPORT_ROOT", str(tmp_path / "exports"))

    app = create_app()
    http = TestClient(app)

    r = http.post(
        "/api/invoices/drafts/manual",
        json={
            "client_id": None,
            "issue_date": "2026-01-15",
            "lines": [{"description": "Producto", "quantity": "1", "unit_price": "100", "discount_pct": "10"}],
        },
    )
    assert r.status_code == 200
    data = r.json()["data"]
    line = data["lines"][0]
    assert line["discount_pct"] == "10"
    # subtotal = 100 * 1 * (1 - 10/100) = 90
    assert float(line["line_subtotal"]) == 90.0
    assert float(data["subtotal"]) == 90.0
