from __future__ import annotations

from app.domain.rules.invoice_invariants import InvalidStateTransitionError
from app.domain.value_objects.invoice_status import InvoiceStatus


_ALLOWED_TRANSITIONS = {
    InvoiceStatus.DRAFT: {InvoiceStatus.OFFICIAL, InvoiceStatus.SPECIAL},
    InvoiceStatus.OFFICIAL: {InvoiceStatus.PAID},
    InvoiceStatus.SPECIAL: set(),
    InvoiceStatus.PAID: set(),
}


def can_transition(current: InvoiceStatus, target: InvoiceStatus) -> bool:
    return target in _ALLOWED_TRANSITIONS.get(current, set())


def ensure_transition(current: InvoiceStatus, target: InvoiceStatus) -> None:
    if not can_transition(current, target):
        raise InvalidStateTransitionError(f"Invalid status transition: {current.value} -> {target.value}")
