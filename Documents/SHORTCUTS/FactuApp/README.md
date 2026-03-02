# FactuApp

Aplicacion local de facturacion para empresa espanola de climatizacion.

## Stack
- Python
- FastAPI
- SQLite
- openpyxl
- ReportLab
- HTML + JavaScript

## Reglas criticas implementadas
- Calculo monetario con `decimal.Decimal` y redondeo `ROUND_HALF_UP`.
- Numeracion oficial anual estricta y atomica en transaccion SQLite `BEGIN IMMEDIATE`.
- Numeracion solo al pasar de `DRAFT` a `OFFICIAL`.
- Exportacion desacoplada de oficializacion.
- Si falla exportacion a carpeta de red, la factura sigue `OFFICIAL` y se registra `EXPORT_FAILED`.
- Datos del emisor bloqueados para este despliegue (no editables desde UI).

## Emisor fijo (no editable en UI)
- Empresa: `Arteclima 2020 SLU`
- CIF: `B88644455`
- Direccion: `Calle Rio Guadarrama 22, 28971, Grinon, Madrid`
- Email: `arteclima@arteclimaslu.com`
- Telefono: `+34 637 568 249`
- IBAN: `ES78 0081 5149 8100 0128 2333`
- Pais: `Spain`
- Moneda: `EUR`
- IVA: `21%`

## Compatibilidad cross-platform
- Soportado en `Windows 11+`.
- Soportado en `macOS` Intel y Apple Silicon.
- Sin rutas hardcodeadas por sistema operativo.
- Todas las operaciones de filesystem usan `pathlib`.
- Exportadores `openpyxl` y `reportlab` son multiplataforma.

## Configuracion de rutas de exportacion de red
La ruta se define con `FACTUAPP_EXPORT_ROOT`.

- Windows (UNC):
  - Ejemplo: `\\\\server\\share\\facturas`
  - Si se configura `/Volumes/...` en Windows, la app falla con error de configuracion.

- macOS:
  - Ejemplo: `/Volumes/facturas`
  - Si se configura una ruta UNC en macOS, la app falla con error de configuracion.

- Ruta local (ambos OS):
  - Ejemplo: `data/network_exports`
  - Util para desarrollo local.

## Ejecutar en macOS
```bash
python3 -m pip install -r requirements.txt
export FACTUAPP_DB_PATH=data/factuapp.db
export FACTUAPP_EXPORT_ROOT=/Volumes/facturas
python3 scripts/init_db.py
python3 scripts/start_dev.py
```

## Ejecutar en Windows (PowerShell)
```powershell
py -m pip install -r requirements.txt
$env:FACTUAPP_DB_PATH = "data/factuapp.db"
$env:FACTUAPP_EXPORT_ROOT = "\\\\server\\share\\facturas"
py scripts/init_db.py
py scripts/start_dev.py
```

## Comandos de arranque (cross-platform)
- Desarrollo (uvicorn con recarga): `python scripts/start_dev.py`
- Produccion (sin sintaxis de shell especifica): `python scripts/start_prod.py`

## API Start
- Desarrollo: `python scripts/start_dev.py`
- Produccion: `python scripts/start_prod.py`

Base URL por defecto: `http://127.0.0.1:8000`

## Uso UI (navegador)
- La UI se sirve desde FastAPI en la raiz `/`.
- Inicia la app y abre: `http://127.0.0.1:8000`
- La pantalla principal tiene 3 pestanas:
  - `Nueva factura`
  - `Clientes`
  - `Historico`

### Flujo basico (para papa)
1. Ir a `Clientes` y crear el cliente una sola vez.
2. Ir a `Nueva factura` y elegir modo:
   - `Manual` para capturar lineas a mano.
   - `Inteligente` para pegar texto libre.
   - `Especial` para documento NO OFICIAL.
3. Guardar borrador y revisar preview.
4. Si todo esta bien, pulsar `Oficializar`.
5. Exportar con `Exportar PDF` o `Exportar Excel`.
6. Usar `Historico` para buscar facturas y reabrir borradores.

## Ejemplos curl
Crear cliente:
```bash
curl -s -X POST http://127.0.0.1:8000/api/clients \
  -H 'Content-Type: application/json' \
  -d '{"name":"Clima Norte SL","tax_id":"B12345678"}'
```

Crear DRAFT manual:
```bash
curl -s -X POST http://127.0.0.1:8000/api/invoices/drafts/manual \
  -H 'Content-Type: application/json' \
  -d '{"client_id":"<CLIENT_ID>","issue_date":"2026-02-18","notes":"Mantenimiento","lines":[{"description":"Revision split","quantity":"1","unit_price":"120"}]}'
```

Oficializar factura:
```bash
curl -s -X POST http://127.0.0.1:8000/api/invoices/<INVOICE_ID>/officialize
```

Exportar PDF:
```bash
curl -s -X POST http://127.0.0.1:8000/api/invoices/<INVOICE_ID>/export/pdf
```

Listar facturas por filtros:
```bash
curl -s "http://127.0.0.1:8000/api/invoices?status=OFFICIAL&year=2026"
```

## Tests
```bash
python3 -m pytest
```

## QA Manual UI
- Checklist en `docs/ui_manual_qa.md`.

## Template Upgrade
- Documentacion completa: `docs/template_upgrade.md`
- Generar plantilla PRO:
```bash
python scripts/generate_pro_template.py
```
- Template por defecto del despliegue actual: `legacy:FACTURA 012 BAR RENATO VILLAVERDE.xlsx`.
- PRO sigue disponible con `FACTUAPP_EXPORT_TEMPLATE=pro`.

## Calidad PDF (LibreOffice preferido)
- El exportador PDF detecta LibreOffice automaticamente por:
  - `soffice` en `PATH`
  - `/Applications/LibreOffice.app/Contents/MacOS/soffice` (macOS)
- Si la conversion `XLSX -> PDF` funciona, se usa LibreOffice y se preserva el layout exacto de la plantilla.
- Solo si falla la conversion, se usa fallback ReportLab.
- Se registra en logs:
  - `LibreOffice detected: YES/NO`
  - `PDF export mode: LibreOffice | ReportLab fallback`
