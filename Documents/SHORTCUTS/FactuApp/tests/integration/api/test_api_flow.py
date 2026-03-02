from fastapi.testclient import TestClient
from uuid import uuid4

from app.main import create_app


def test_api_draft_to_official_flow(tmp_path, monkeypatch):
    db_path = tmp_path / "api.db"
    export_root = tmp_path / "exports"
    monkeypatch.setenv("FACTUAPP_DB_PATH", str(db_path))
    monkeypatch.setenv("FACTUAPP_EXPORT_ROOT", str(export_root))

    app = create_app()
    client = TestClient(app)

    client_response = client.post(
        "/api/clients",
        json={"name": "Cliente API", "tax_id": f"B{uuid4().hex[:8]}"},
    )
    assert client_response.status_code == 200
    client_id = client_response.json()["data"]["id"]

    create_response = client.post(
        "/api/invoices/drafts/manual",
        json={
            "client_id": client_id,
            "issue_date": "2026-02-18",
            "notes": "test",
            "lines": [{"description": "Instalacion", "quantity": "1", "unit_price": "100"}],
        },
    )
    assert create_response.status_code == 200
    invoice_id = create_response.json()["data"]["id"]

    officialize_response = client.post(f"/api/invoices/{invoice_id}/officialize")
    assert officialize_response.status_code == 200
    payload = officialize_response.json()["data"]
    assert payload["status"] == "OFFICIAL"
    assert payload["official_code"].startswith("2026-")


def test_invoice_list_ordering(tmp_path, monkeypatch):
    monkeypatch.setenv("FACTUAPP_DB_PATH", str(tmp_path / "order.db"))
    monkeypatch.setenv("FACTUAPP_EXPORT_ROOT", str(tmp_path / "exports"))

    app = create_app()
    http = TestClient(app)

    ids = set()
    # Use unique amounts unlikely to collide with production data
    for amount in ["10001.00", "30003.00", "20002.00"]:
        r = http.post(
            "/api/invoices/drafts/manual",
            json={
                "client_id": None,
                "issue_date": "2026-06-01",
                "lines": [{"description": "test-order", "quantity": "1", "unit_price": amount}],
            },
        )
        ids.add(r.json()["data"]["id"])

    # Extract only our 3 invoices from the full sorted list
    asc = http.get("/api/invoices?order_by=total&direction=asc").json()["data"]
    our_asc = [i for i in asc if i["id"] in ids]
    assert len(our_asc) == 3
    totals_asc = [float(i["total"]) for i in our_asc]
    assert totals_asc == sorted(totals_asc)

    desc = http.get("/api/invoices?order_by=total&direction=desc").json()["data"]
    our_desc = [i for i in desc if i["id"] in ids]
    assert len(our_desc) == 3
    totals_desc = [float(i["total"]) for i in our_desc]
    assert totals_desc == sorted(totals_desc, reverse=True)


def test_export_pdf_binary(tmp_path, monkeypatch):
    monkeypatch.setenv("FACTUAPP_DB_PATH", str(tmp_path / "export.db"))
    monkeypatch.setenv("FACTUAPP_EXPORT_ROOT", str(tmp_path / "exports"))

    app = create_app()
    http = TestClient(app)

    client_r = http.post("/api/clients", json={"name": "Export Test Client", "tax_id": f"X{uuid4().hex[:7]}"})
    assert client_r.status_code == 200
    client_id = client_r.json()["data"]["id"]

    draft = http.post(
        "/api/invoices/drafts/manual",
        json={
            "client_id": client_id,
            "issue_date": "2026-06-15",
            "lines": [{"description": "Servicio exportacion", "quantity": "1", "unit_price": "500"}],
        },
    )
    assert draft.status_code == 200
    invoice_id = draft.json()["data"]["id"]

    off = http.post(f"/api/invoices/{invoice_id}/officialize")
    assert off.status_code == 200

    response = http.post(f"/api/invoices/{invoice_id}/export/pdf")
    assert response.status_code == 200
    assert "application/pdf" in response.headers["content-type"]
    assert response.content[:4] == b"%PDF"
