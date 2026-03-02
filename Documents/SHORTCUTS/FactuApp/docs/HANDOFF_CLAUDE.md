# Handoff Context For Claude

## Current Branch
- `main`

## Objective Achieved
- Export pipeline tuned for legacy-like visual output.
- PDF export prioritizes LibreOffice conversion (macOS + PATH detection), with ReportLab fallback only on conversion failure.
- Issuer data is locked in settings and injected automatically into exports.

## Key Decisions
- Default template switched to legacy reference:
  - `legacy:FACTURA 012 BAR RENATO VILLAVERDE.xlsx`
- Dedicated mapping added for that template:
  - `templates/excel/FACTURA 012 BAR RENATO VILLAVERDE.map.json`
- PRO template remains available by setting:
  - `FACTUAPP_EXPORT_TEMPLATE=pro`

## Important Files Changed
- `config/settings.py`
- `app/infrastructure/exporters/excel_exporter_openpyxl.py`
- `app/infrastructure/exporters/pdf_exporter_reportlab.py`
- `app/infrastructure/exporters/pro_template_generator.py`
- `app/api/routers/invoices.py`
- `config/template_map_pro.json`
- `templates/excel/factuapp_pro.xlsx`
- `templates/excel/FACTURA 012 BAR RENATO VILLAVERDE.map.json`
- `tests/unit/application/test_template_upgrade.py`
- `README.md`

## Issuer Lock (Hardcoded)
- Arteclima 2020 SLU
- CIF: B88644455
- Address: Calle Río Guadarrama 22, 28971, Griñón, Madrid
- Email: arteclima@arteclimaslu.com
- Phone: +34 637 568 249
- IBAN: ES78 0081 5149 8100 0128 2333
- Country: Spain
- Currency: EUR
- VAT: 21%

## LibreOffice PDF Behavior
- Detection order:
  - `soffice` in PATH
  - `/Applications/LibreOffice.app/Contents/MacOS/soffice`
- Log lines expected during export:
  - `LibreOffice detected: YES/NO`
  - `PDF export mode: LibreOffice` or `ReportLab fallback`

## Latest Validations
- `python3 -m pytest -q` -> all tests passing.
- `python3 scripts/smoke_test.py` (outside sandbox) confirms:
  - LibreOffice detected: YES
  - PDF export mode: LibreOffice
  - XLSX + PDF generated successfully.

## Known Gap To Continue
- Visual fidelity is better but still not fully matching user’s preferred PDF style.
- Next step is precise layout calibration against one selected legacy PDF reference (pixel-level spacing, typography, table rhythm).
