from fastapi.testclient import TestClient

from app.main import create_app


def test_stats_returns_expected_keys():
    app = create_app()
    client = TestClient(app)

    response = client.get("/api/stats")
    assert response.status_code == 200
    data = response.json()
    assert "by_status" in data
    assert "monthly_income" in data
    assert "top_clients" in data


def test_stats_pending_reflects_official_invoices():
    """Creating and officializing an invoice increments OFFICIAL count and total."""
    app = create_app()
    client = TestClient(app)

    # Snapshot baseline
    initial = client.get("/api/stats").json()
    initial_official = next(
        (r for r in initial["by_status"] if r["status"] == "OFFICIAL"),
        {"total": 0.0, "count": 0},
    )

    # Create a client and officialize one invoice (base 100 → total 121 with 21% IVA)
    cr = client.post("/api/clients", json={"name": "Test Stats Delta Client"})
    assert cr.status_code == 200
    client_id = cr.json()["data"]["id"]

    dr = client.post(
        "/api/invoices/drafts/manual",
        json={
            "client_id": client_id,
            "issue_date": "2026-03-01",
            "lines": [{"description": "Servicio test stats", "quantity": "1", "unit_price": "100"}],
        },
    )
    assert dr.status_code == 200
    invoice_id = dr.json()["data"]["id"]

    off = client.post(f"/api/invoices/{invoice_id}/officialize")
    assert off.status_code == 200

    # Check delta
    updated = client.get("/api/stats").json()
    updated_official = next(
        (r for r in updated["by_status"] if r["status"] == "OFFICIAL"),
        {"total": 0.0, "count": 0},
    )

    assert updated_official["count"] == initial_official["count"] + 1
    assert abs(updated_official["total"] - initial_official["total"] - 121.0) < 0.01


def test_stats_monthly_income_only_official_paid():
    """Drafts do not appear in monthly_income; officializing makes them appear."""
    app = create_app()
    client = TestClient(app)

    # Snapshot baseline monthly sum
    initial = client.get("/api/stats").json()
    initial_monthly_sum = sum(m["total"] for m in initial["monthly_income"])

    # Create a client so the invoice can be officialized later
    cr = client.post("/api/clients", json={"name": "Test Stats Monthly Client"})
    assert cr.status_code == 200
    client_id = cr.json()["data"]["id"]

    # Create a draft — should NOT change monthly_income
    draft_r = client.post(
        "/api/invoices/drafts/manual",
        json={
            "client_id": client_id,
            "issue_date": "2026-03-01",
            "lines": [{"description": "Draft stats test", "quantity": "1", "unit_price": "50"}],
        },
    )
    assert draft_r.status_code == 200
    draft_id = draft_r.json()["data"]["id"]

    after_draft = client.get("/api/stats").json()
    after_draft_sum = sum(m["total"] for m in after_draft["monthly_income"])
    assert after_draft_sum == initial_monthly_sum  # draft didn't change anything

    # Officialize — monthly_income must grow
    client.post(f"/api/invoices/{draft_id}/officialize")

    after_official = client.get("/api/stats").json()
    after_official_sum = sum(m["total"] for m in after_official["monthly_income"])
    assert after_official_sum > initial_monthly_sum  # now appears in monthly
