# Numbering Policy

1. Number assignment happens only when invoice transitions from `DRAFT` to `OFFICIAL`.
2. Transaction uses `BEGIN IMMEDIATE` and updates both `numbering_counters` and `invoices` in one commit.
3. `DRAFT` and `SPECIAL` never consume numbering.
4. Yearly reset is automatic because counter key is `(fiscal_year, series)`.
5. On any failure during officialization, `ROLLBACK` avoids number consumption.
