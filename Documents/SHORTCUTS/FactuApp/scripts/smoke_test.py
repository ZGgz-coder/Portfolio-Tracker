from __future__ import annotations

import sys
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.main import create_app
from config.settings import settings


def fail(message: str, code: int = 1) -> None:
    print(f"[FAIL] {message}")
    raise SystemExit(code)


def ensure_storage_reachable() -> Path:
    try:
        root = settings.export_root
    except Exception as exc:  # pragma: no cover
        fail(f"Invalid export root configuration: {exc}", code=2)

    try:
        root.mkdir(parents=True, exist_ok=True)
        probe = root / ".smoke_write_probe.tmp"
        probe.write_text("ok", encoding="utf-8")
        probe.unlink(missing_ok=True)
        return root
    except Exception as exc:
        fail(
            "Export storage path is not reachable/writable. "
            f"Configured path: {root}. Error: {exc}",
            code=2,
        )


def expect_ok(response, step: str) -> dict:
    payload = {}
    try:
        payload = response.json()
    except Exception:
        pass
    if response.status_code >= 400:
        fail(f"{step} failed with HTTP {response.status_code}: {payload}")
    return payload


def main() -> int:
    print("[SMOKE] Starting end-to-end smoke test")
    export_root = ensure_storage_reachable()
    print(f"[OK] Export storage reachable: {export_root}")

    app = create_app()
    client = TestClient(app)

    tax_id = f"B{uuid4().hex[:8]}"
    client_payload = expect_ok(
        client.post(
            "/api/clients",
            json={"name": "Cliente Smoke Test", "tax_id": tax_id, "email": "smoke@example.com"},
        ),
        "Create client",
    )
    client_id = client_payload["data"]["id"]
    print(f"[OK] Client created: id={client_id}")

    draft_payload = expect_ok(
        client.post(
            "/api/invoices/drafts/manual",
            json={
                "client_id": client_id,
                "issue_date": "2026-02-18",
                "notes": "Smoke test draft",
                "lines": [
                    {"description": "Instalacion equipo split", "quantity": "1", "unit_price": "750.00"},
                    {"description": "Mantenimiento preventivo", "quantity": "2", "unit_price": "90.00"},
                ],
            },
        ),
        "Create manual draft",
    )
    invoice_id = draft_payload["data"]["id"]
    print(f"[OK] Draft created: id={invoice_id}")

    official_payload = expect_ok(
        client.post(f"/api/invoices/{invoice_id}/officialize"),
        "Officialize invoice",
    )
    official_code = official_payload["data"].get("official_code")
    print(f"[OK] Invoice officialized: {official_code}")

    pdf_payload = expect_ok(
        client.post(f"/api/invoices/{invoice_id}/export/pdf"),
        "Export PDF",
    )
    xlsx_payload = expect_ok(
        client.post(f"/api/invoices/{invoice_id}/export/xlsx"),
        "Export XLSX",
    )

    pdf_path = pdf_payload.get("path", "<missing>")
    xlsx_path = xlsx_payload.get("path", "<missing>")

    print("[OK] Exports completed")
    print(f"[RESULT] PDF:  {pdf_path}")
    print(f"[RESULT] XLSX: {xlsx_path}")
    print("[SMOKE] Completed successfully")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
