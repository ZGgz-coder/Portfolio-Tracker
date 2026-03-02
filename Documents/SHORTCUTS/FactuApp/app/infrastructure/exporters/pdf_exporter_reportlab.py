from __future__ import annotations

from collections.abc import Callable
from decimal import Decimal
import logging
from io import BytesIO
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from app.domain.entities.invoice import Invoice
from config.settings import settings


logger = logging.getLogger(__name__)

# ── Palette ───────────────────────────────────────────────────────────────────
_DARK   = colors.HexColor("#1A1A1A")
_GRAY   = colors.HexColor("#666666")
_LGRAY  = colors.HexColor("#999999")
_BORDER = colors.HexColor("#CCCCCC")
_HBG    = colors.HexColor("#F2F2F2")   # table header / alternating row bg
_NAVY   = colors.HexColor("#1B3F6A")   # TOTAL FACTURA row
_WHITE  = colors.white
# ─────────────────────────────────────────────────────────────────────────────


class PdfExporter:
    def __init__(
        self,
        project_root: Path | None = None,
        client_resolver: Callable[[str], object | None] | None = None,
        excel_exporter=None,
    ):
        self.project_root = project_root or Path(__file__).resolve().parents[3]
        self.client_resolver = client_resolver

    # ── public ────────────────────────────────────────────────────────────────

    def render(self, invoice: Invoice) -> bytes:
        logger.warning("PDF export mode: ReportLab premium")
        return self._render_premium(invoice)

    # ── helpers ───────────────────────────────────────────────────────────────

    def _resolve_logo(self) -> Path | None:
        logo_dir  = self.project_root / "templates" / "logo"
        assets_dir = self.project_root / "assets"
        for candidate in [
            logo_dir  / "LOGO_HORIZONTAL.png",
            logo_dir  / "logo.png",
            assets_dir / "logo.png",
            logo_dir  / "logo.jpg",
            assets_dir / "logo.jpg",
            logo_dir  / "logo.jpeg",
            assets_dir / "logo.jpeg",
        ]:
            if candidate.exists():
                return candidate
        for ext in ("*.png", "*.jpg", "*.jpeg"):
            found = sorted(logo_dir.glob(ext))
            if found:
                return found[0]
        return None

    @staticmethod
    def _money(value: Decimal) -> str:
        """European Spanish: 1.125,30 €"""
        int_part = int(abs(value))
        dec_part = int(round((abs(float(value)) - int_part) * 100))
        int_str  = f"{int_part:,}".replace(",", ".")
        sign     = "-" if value < 0 else ""
        return f"{sign}{int_str},{dec_part:02d} \u20ac"

    @staticmethod
    def _qty(value: Decimal) -> str:
        """European quantity: 2,00"""
        return f"{float(value):.2f}".replace(".", ",")

    def _resolve_client(self, invoice: Invoice) -> tuple[str, str, str, str, str]:
        """Returns (name, tax_id, address_line, city_line, postal)."""
        if not invoice.client_id or not self.client_resolver:
            return (invoice.client_id or "", "", "", "", "")
        client = self.client_resolver(invoice.client_id)
        if client is None:
            return (invoice.client_id, "", "", "", "")
        name    = getattr(client, "name",        None) or ""
        tax_id  = getattr(client, "tax_id",      None) or ""
        address = getattr(client, "address",     None) or ""
        city    = getattr(client, "city",        None) or ""
        postal  = getattr(client, "postal_code", None) or ""
        province = getattr(client, "province",   None) or ""
        city_full = " ".join(p for p in [city, province] if p)
        return (name, tax_id, address, city_full, postal)

    # ── main renderer ─────────────────────────────────────────────────────────

    def _render_premium(self, invoice: Invoice) -> bytes:
        output = BytesIO()
        pdf    = canvas.Canvas(output, pagesize=A4)
        W, H   = A4
        M      = 15 * mm        # side margin
        CW     = W - 2 * M      # usable content width

        y = H - 12 * mm         # top cursor

        # ── 1. HEADER ─────────────────────────────────────────────────────────
        logo_path  = self._resolve_logo()
        LOGO_MAX_W = 55 * mm
        LOGO_MAX_H = 19 * mm

        # Draw logo (top-left)
        if logo_path:
            try:
                pdf.drawImage(
                    ImageReader(str(logo_path)),
                    M, y - LOGO_MAX_H,
                    width=LOGO_MAX_W, height=LOGO_MAX_H,
                    preserveAspectRatio=True, anchor="sw", mask="auto",
                )
                issuer_y = y - LOGO_MAX_H - 3 * mm
            except Exception:
                logo_path = None
                issuer_y  = y - 2 * mm
        else:
            issuer_y = y - 2 * mm

        # Issuer block (left column, below logo)
        if not logo_path:
            pdf.setFont("Helvetica-Bold", 11)
            pdf.setFillColor(_DARK)
            pdf.drawString(M, issuer_y, settings.issuer_name)
            issuer_y -= 5 * mm
        else:
            pdf.setFont("Helvetica-Bold", 9)
            pdf.setFillColor(_DARK)
            pdf.drawString(M, issuer_y, settings.issuer_name)
            issuer_y -= 4.5 * mm

        pdf.setFont("Helvetica", 8.5)
        pdf.setFillColor(_GRAY)
        for line_text in [
            f"CIF {settings.issuer_tax_id}",
            settings.issuer_address,
            settings.issuer_email,
        ]:
            pdf.drawString(M, issuer_y, line_text)
            issuer_y -= 4.5 * mm

        # Invoice number + date (right column)
        inv_code = invoice.official_code or "BORRADOR"
        inv_date = invoice.issue_date.strftime("%d/%m/%Y")

        pdf.setFont("Helvetica-Bold", 12)
        pdf.setFillColor(_DARK)
        pdf.drawRightString(W - M, y - 8 * mm, f"Factura N\u00ba {inv_code}")

        pdf.setFont("Helvetica", 9.5)
        pdf.setFillColor(_GRAY)
        pdf.drawRightString(W - M, y - 14.5 * mm, f"Fecha {inv_date}")

        # Separator line below header
        header_bottom = min(issuer_y - 3 * mm, y - 38 * mm)
        pdf.setStrokeColor(_BORDER)
        pdf.setLineWidth(0.5)
        pdf.line(M, header_bottom, W - M, header_bottom)
        y = header_bottom - 6 * mm

        # ── 2. CLIENT SECTION ─────────────────────────────────────────────────
        client_name, client_tax_id, client_addr, client_city, client_postal = (
            self._resolve_client(invoice)
        )

        # "Datos Cliente" heading
        pdf.setFont("Helvetica-Bold", 8)
        pdf.setFillColor(_LGRAY)
        pdf.drawString(M, y, "Datos Cliente")
        y -= 5.5 * mm

        LABEL_W = 38 * mm
        client_rows: list[tuple[str, str]] = [
            ("Nombre:", client_name or "-"),
            ("DNI/CIF:", client_tax_id or "-"),
        ]
        if client_addr:
            client_rows.append(("Direcci\u00f3n:", client_addr))
        if client_city:
            client_rows.append(("Poblaci\u00f3n/Provincia:", client_city))
        if client_postal:
            client_rows.append(("C.P:", client_postal))

        for label, value in client_rows:
            pdf.setFont("Helvetica-Bold", 8.5)
            pdf.setFillColor(_GRAY)
            pdf.drawString(M, y, label)
            pdf.setFont("Helvetica", 8.5)
            pdf.setFillColor(_DARK)
            pdf.drawString(M + LABEL_W, y, value)
            y -= 5 * mm

        y -= 3 * mm
        pdf.setStrokeColor(_BORDER)
        pdf.setLineWidth(0.5)
        pdf.line(M, y, W - M, y)
        y -= 6 * mm

        # ── 3. LINES TABLE ────────────────────────────────────────────────────
        # Columns: Descripción (52%) | Cantidad (12%) | Precio Unitario (18%) | Precio Total (18%)
        col_pct = [0.52, 0.12, 0.18, 0.18]
        col_w   = [p * CW for p in col_pct]
        col_x   = [M]
        for w in col_w[:-1]:
            col_x.append(col_x[-1] + w)

        HDR_H = 8 * mm
        ROW_H = 7 * mm

        # Header row
        pdf.setFillColor(_HBG)
        pdf.setStrokeColor(_BORDER)
        pdf.setLineWidth(0.4)
        pdf.rect(M, y - HDR_H, CW, HDR_H, stroke=1, fill=1)

        pdf.setFont("Helvetica-Bold", 8)
        pdf.setFillColor(_DARK)
        headers_left  = ["Descripci\u00f3n"]
        headers_right = ["Cantidad", "Precio Unitario", "Precio Total"]
        pdf.drawString(col_x[0] + 2.5 * mm, y - 5.5 * mm, "Descripci\u00f3n")
        for i, lbl in enumerate(headers_right, start=1):
            pdf.drawRightString(col_x[i] + col_w[i] - 2 * mm, y - 5.5 * mm, lbl)

        y -= HDR_H

        # Data rows
        for idx, line in enumerate(invoice.lines):
            bg = _HBG if idx % 2 == 0 else _WHITE
            pdf.setFillColor(bg)
            pdf.setStrokeColor(_BORDER)
            pdf.setLineWidth(0.3)
            pdf.rect(M, y - ROW_H, CW, ROW_H, stroke=1, fill=1)

            desc = str(line.description)
            if len(desc) > 65:
                desc = desc[:62] + "\u2026"

            pdf.setFont("Helvetica", 8.5)
            pdf.setFillColor(_DARK)
            pdf.drawString(col_x[0] + 2.5 * mm, y - 5 * mm, desc)
            pdf.drawRightString(col_x[1] + col_w[1] - 2 * mm, y - 5 * mm, self._qty(line.quantity))
            pdf.drawRightString(col_x[2] + col_w[2] - 2 * mm, y - 5 * mm, self._money(line.unit_price))
            pdf.drawRightString(col_x[3] + col_w[3] - 2 * mm, y - 5 * mm, self._money(line.line_subtotal))
            y -= ROW_H

        # Bottom border
        pdf.setStrokeColor(_BORDER)
        pdf.setLineWidth(0.8)
        pdf.line(M, y, M + CW, y)
        y -= 7 * mm

        # ── 4. TOTALS ─────────────────────────────────────────────────────────
        BOX_W = 78 * mm
        BOX_X = W - M - BOX_W
        T_ROW = 7.5 * mm
        vat_pct = int(settings.vat_rate * 100)

        totals = [
            ("Base imponible",          invoice.subtotal,   False),
            (f"{vat_pct} % IVA",        invoice.tax_amount, False),
            ("TOTAL FACTURA",            invoice.total,      True),
        ]

        for label, amount, bold in totals:
            if bold:
                pdf.setFillColor(_NAVY)
                pdf.setStrokeColor(_NAVY)
            else:
                pdf.setFillColor(_WHITE)
                pdf.setStrokeColor(_BORDER)
            pdf.setLineWidth(0.4)
            pdf.rect(BOX_X, y - T_ROW, BOX_W, T_ROW, stroke=1, fill=1)

            if bold:
                pdf.setFont("Helvetica-Bold", 9)
                pdf.setFillColor(_WHITE)
            else:
                pdf.setFont("Helvetica", 9)
                pdf.setFillColor(_GRAY)
            pdf.drawString(BOX_X + 3 * mm, y - 5.5 * mm, label)

            pdf.setFillColor(_WHITE if bold else _DARK)
            pdf.drawRightString(BOX_X + BOX_W - 3 * mm, y - 5.5 * mm, self._money(amount))
            y -= T_ROW

        # ── 5. FOOTER ─────────────────────────────────────────────────────────
        footer_top = 24 * mm

        pdf.setStrokeColor(_BORDER)
        pdf.setLineWidth(0.5)
        pdf.line(M, footer_top, W - M, footer_top)

        pdf.setFont("Helvetica-Bold", 8)
        pdf.setFillColor(_LGRAY)
        pdf.drawString(M, footer_top - 5 * mm, "Datos Bancarios")

        pdf.setFont("Helvetica", 8.5)
        pdf.setFillColor(_DARK)
        pdf.drawString(
            M, footer_top - 10.5 * mm,
            f"{settings.issuer_iban}   \u00b7   BANCO DE SABADELL",
        )

        pdf.showPage()
        pdf.save()
        return output.getvalue()
