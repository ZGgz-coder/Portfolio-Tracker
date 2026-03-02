# Template Upgrade (FactuApp Pro)

## Objetivo
Introducir plantillas de exportacion configurables sin tocar logica de dominio, numeracion ni reglas fiscales.

## Modos de exportacion
Variables de entorno:

- `FACTUAPP_EXPORT_MODE=template|simple`
  - `template`: usa motor de plantilla (PRO o legacy).
  - `simple`: usa exportador basico generado por codigo.

- `FACTUAPP_EXPORT_TEMPLATE=pro|legacy:<archivo.xlsx>`
  - `pro` (default): `templates/excel/factuapp_pro.xlsx`
  - `legacy:<file>.xlsx`: usa un template existente en `templates/excel/`.

## Plantilla PRO
Generador:

```bash
python scripts/generate_pro_template.py
```

Salida:
- `templates/excel/factuapp_pro.xlsx`
- `config/template_map_pro.json`

## Logo
Ubicacion recomendada:
- `assets/logo.png` (preferido)
- `assets/logo.svg` (si solo hay SVG, se deja placeholder; openpyxl no incrusta SVG directo)

## Mapeo (mapping-first)
El exportador no usa celdas hardcodeadas para el template PRO.
Lee posiciones desde JSON:
- `config/template_map_pro.json`

Para legacy, opcionalmente puedes crear:
- `templates/excel/<nombre>.map.json`
Si no existe, usara el mapa PRO por defecto.

## PDF via LibreOffice (opcional)
Si `soffice` esta en PATH:
- se intenta conversion `XLSX -> PDF` en modo headless.
- el hash de integridad se incluye en el XLSX antes de convertir.

Si no hay `soffice` (o falla conversion):
- fallback automatico a ReportLab.

## Compatibilidad
- Windows 11+
- macOS (Intel y Apple Silicon)

## Notas
- Si la plantilla falla en modo `template`, el exportador hace fallback a `simple` para no bloquear operativa.
- Las plantillas legacy siguen disponibles mediante `FACTUAPP_EXPORT_TEMPLATE=legacy:<archivo.xlsx>`.
