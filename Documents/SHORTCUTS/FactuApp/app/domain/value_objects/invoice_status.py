from enum import Enum


class InvoiceStatus(str, Enum):
    DRAFT = "DRAFT"
    OFFICIAL = "OFFICIAL"
    SPECIAL = "SPECIAL"
    PAID = "PAID"
