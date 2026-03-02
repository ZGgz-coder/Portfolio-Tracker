from __future__ import annotations

from app.domain.value_objects.invoice_status import InvoiceStatus


class DomainError(ValueError):
    pass


class NotFoundError(DomainError):
    pass


class InvalidStateTransitionError(DomainError):
    pass


class OfficialInvoiceImmutableError(DomainError):
    pass


class OfficializationInvariantError(DomainError):
    pass


class RepositoryIntegrityError(DomainError):
    pass


class IntegrityViolationError(DomainError):
    pass


class ExportOperationalError(DomainError):
    pass


def ensure_official_has_numbering(
    status: InvoiceStatus,
    fiscal_year: int | None,
    official_number: int | None,
    official_code: str | None,
    integrity_hash: str | None,
) -> None:
    if status in {InvoiceStatus.OFFICIAL, InvoiceStatus.PAID} and (
        fiscal_year is None or official_number is None or official_code is None or integrity_hash is None
    ):
        raise OfficializationInvariantError("OFFICIAL invoice must contain fiscal numbering and integrity hash")


def ensure_non_official_has_no_numbering(
    status: InvoiceStatus,
    fiscal_year: int | None,
    official_number: int | None,
    official_code: str | None,
    integrity_hash: str | None,
) -> None:
    if status in {InvoiceStatus.DRAFT, InvoiceStatus.SPECIAL} and any([fiscal_year, official_number, official_code, integrity_hash]):
        raise OfficializationInvariantError("DRAFT/SPECIAL invoice cannot have official numbering or integrity hash")


def ensure_draft_editable(status: InvoiceStatus) -> None:
    if status != InvoiceStatus.DRAFT:
        raise OfficialInvoiceImmutableError("Only DRAFT invoices are editable")
