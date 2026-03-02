from __future__ import annotations

import sqlite3
from pathlib import Path

from config.settings import settings

SCHEMA_SQL = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tax_id TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    province TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'OFFICIAL', 'SPECIAL', 'PAID')),
    issue_date TEXT NOT NULL,
    client_id TEXT,
    series TEXT NOT NULL,
    fiscal_year INTEGER,
    official_number INTEGER,
    official_code TEXT UNIQUE,
    integrity_hash TEXT,
    currency TEXT NOT NULL DEFAULT 'EUR',
    subtotal TEXT NOT NULL,
    tax_rate TEXT NOT NULL,
    tax_amount TEXT NOT NULL,
    total TEXT NOT NULL,
    notes TEXT,
    source_type TEXT NOT NULL,
    free_text_raw TEXT,
    officialized_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    rectifies_invoice_id TEXT,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS invoice_lines (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    line_order INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity TEXT NOT NULL,
    unit_price TEXT NOT NULL,
    line_subtotal TEXT NOT NULL,
    tax_rate TEXT NOT NULL,
    line_tax TEXT NOT NULL,
    line_total TEXT NOT NULL,
    discount_pct TEXT NOT NULL DEFAULT '0',
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS numbering_counters (
    fiscal_year INTEGER NOT NULL,
    series TEXT NOT NULL,
    last_number INTEGER NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (fiscal_year, series)
);

CREATE TABLE IF NOT EXISTS invoice_events (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_payload TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);
"""


def get_connection(db_path: str | None = None) -> sqlite3.Connection:
    path = Path(db_path or settings.db_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path, detect_types=sqlite3.PARSE_DECLTYPES, isolation_level=None, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def _ensure_migrations(conn: sqlite3.Connection) -> None:
    # invoices columns
    inv_columns = [row["name"] for row in conn.execute("PRAGMA table_info(invoices)").fetchall()]
    if "integrity_hash" not in inv_columns:
        conn.execute("ALTER TABLE invoices ADD COLUMN integrity_hash TEXT")
    if "rectifies_invoice_id" not in inv_columns:
        conn.execute("ALTER TABLE invoices ADD COLUMN rectifies_invoice_id TEXT")

    # invoice_lines columns
    line_columns = [row["name"] for row in conn.execute("PRAGMA table_info(invoice_lines)").fetchall()]
    if "discount_pct" not in line_columns:
        conn.execute("ALTER TABLE invoice_lines ADD COLUMN discount_pct TEXT NOT NULL DEFAULT '0'")

    # Recreate invoices table if PAID not in the CHECK constraint
    create_sql = conn.execute(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='invoices'"
    ).fetchone()
    if create_sql and "'PAID'" not in create_sql["sql"]:
        conn.executescript("""
PRAGMA foreign_keys = OFF;
CREATE TABLE invoices_new (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'OFFICIAL', 'SPECIAL', 'PAID')),
    issue_date TEXT NOT NULL,
    client_id TEXT,
    series TEXT NOT NULL,
    fiscal_year INTEGER,
    official_number INTEGER,
    official_code TEXT UNIQUE,
    integrity_hash TEXT,
    currency TEXT NOT NULL DEFAULT 'EUR',
    subtotal TEXT NOT NULL,
    tax_rate TEXT NOT NULL,
    tax_amount TEXT NOT NULL,
    total TEXT NOT NULL,
    notes TEXT,
    source_type TEXT NOT NULL,
    free_text_raw TEXT,
    officialized_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    rectifies_invoice_id TEXT,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);
INSERT INTO invoices_new SELECT
    id, status, issue_date, client_id, series, fiscal_year, official_number, official_code,
    integrity_hash, currency, subtotal, tax_rate, tax_amount, total, notes, source_type,
    free_text_raw, officialized_at, created_at, updated_at,
    NULL
FROM invoices;
DROP TABLE invoices;
ALTER TABLE invoices_new RENAME TO invoices;
PRAGMA foreign_keys = ON;
""")


def init_db(db_path: str | None = None) -> None:
    conn = get_connection(db_path)
    try:
        conn.executescript(SCHEMA_SQL)
        _ensure_migrations(conn)
    finally:
        conn.close()
