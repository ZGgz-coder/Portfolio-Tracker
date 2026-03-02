from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import create_app


def test_clients_crud_flow(tmp_path, monkeypatch):
    monkeypatch.setenv("FACTUAPP_DB_PATH", str(tmp_path / "api-clients.db"))
    monkeypatch.setenv("FACTUAPP_EXPORT_ROOT", str(tmp_path / "exports"))

    client = TestClient(create_app())

    create_response = client.post(
        "/api/clients",
        json={"name": "Cliente Uno", "tax_id": f"B{uuid4().hex[:8]}"},
    )
    assert create_response.status_code == 200
    client_id = create_response.json()["data"]["id"]

    get_response = client.get(f"/api/clients/{client_id}")
    assert get_response.status_code == 200
    assert get_response.json()["data"]["name"] == "Cliente Uno"

    update_response = client.put(
        f"/api/clients/{client_id}",
        json={"name": "Cliente Uno Actualizado", "tax_id": None, "email": "ops@example.com"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["data"]["name"] == "Cliente Uno Actualizado"

    list_response = client.get("/api/clients")
    assert list_response.status_code == 200
    assert any(item["id"] == client_id for item in list_response.json()["data"])


def test_client_list_search(tmp_path, monkeypatch):
    monkeypatch.setenv("FACTUAPP_DB_PATH", str(tmp_path / "search.db"))
    monkeypatch.setenv("FACTUAPP_EXPORT_ROOT", str(tmp_path / "exports"))

    http = TestClient(create_app())

    # Use unique tax IDs to avoid collisions with production data
    tax_garcia = f"SRCH{uuid4().hex[:6].upper()}"
    tax_lopez  = f"SRCH{uuid4().hex[:6].upper()}"
    http.post("/api/clients", json={"name": f"Fontaneria Garcia {tax_garcia}", "tax_id": tax_garcia})
    http.post("/api/clients", json={"name": f"Electricidad Lopez {tax_lopez}",  "tax_id": tax_lopez})

    res = http.get(f"/api/clients?search={tax_garcia}")
    assert res.status_code == 200
    names = [c["name"] for c in res.json()["data"]]
    assert any(tax_garcia in n for n in names)
    assert all(tax_lopez not in n for n in names)

    res_tax = http.get(f"/api/clients?search={tax_lopez}")
    assert res_tax.status_code == 200
    names_tax = [c["name"] for c in res_tax.json()["data"]]
    assert any(tax_lopez in n for n in names_tax)

    # Without filter, both should appear in the full list
    res_all = http.get("/api/clients")
    all_tax_ids = [c["tax_id"] for c in res_all.json()["data"]]
    assert tax_garcia in all_tax_ids
    assert tax_lopez in all_tax_ids
