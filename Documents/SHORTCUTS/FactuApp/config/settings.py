from __future__ import annotations

import os
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path


def resolve_export_root(raw_path: str, platform_name: str | None = None) -> Path:
    platform = platform_name or os.name
    candidate = raw_path.strip()
    is_unc = candidate.startswith("\\\\")
    is_macos_volume = candidate.startswith("/Volumes/")

    if is_unc and platform != "nt":
        raise ValueError(
            "UNC path configured on non-Windows OS. "
            "Use a mounted volume path such as /Volumes/share on macOS."
        )
    if is_macos_volume and platform == "nt":
        raise ValueError(
            "/Volumes path configured on Windows. "
            "Use a UNC path such as \\\\server\\share."
        )
    return Path(candidate)


@dataclass(frozen=True)
class Settings:
    app_name: str = "FactuApp"
    db_path: str = os.getenv("FACTUAPP_DB_PATH", "data/factuapp.db")
    network_export_root: str = os.getenv("FACTUAPP_EXPORT_ROOT", "data/network_exports")
    default_series: str = os.getenv("FACTUAPP_DEFAULT_SERIES", "A")
    export_mode: str = os.getenv("FACTUAPP_EXPORT_MODE", "template")
    export_template: str = os.getenv(
        "FACTUAPP_EXPORT_TEMPLATE",
        "legacy:FACTURA 012 BAR RENATO VILLAVERDE.xlsx",
    )
    issuer_name: str = "Arteclima 2020 SLU"
    issuer_tax_id: str = "B88644455"
    issuer_address: str = "Calle Río Guadarrama 22, 28971, Griñón, Madrid"
    issuer_email: str = "arteclima@arteclimaslu.com"
    issuer_phone: str = "+34 637 568 249"
    issuer_iban: str = "ES78 0081 5149 8100 0128 2333"
    issuer_country: str = "Spain"
    currency: str = "EUR"
    vat_rate: Decimal = Decimal("0.21")

    @property
    def db_file(self) -> Path:
        return Path(self.db_path)

    @property
    def export_root(self) -> Path:
        return resolve_export_root(self.network_export_root)


settings = Settings()
