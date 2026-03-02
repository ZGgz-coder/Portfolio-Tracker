from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

from app.domain.rules.invoice_invariants import (
    DomainError,
    ExportOperationalError,
    IntegrityViolationError,
    NotFoundError,
)


def _error_payload(code: str, message: str, details: dict | None = None) -> dict:
    return {
        "code": code,
        "message": message,
        "details": details,
    }


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(NotFoundError)
    async def not_found_handler(_, exc: NotFoundError):
        return JSONResponse(
            status_code=404,
            content=_error_payload("NOT_FOUND", str(exc), {"type": exc.__class__.__name__}),
        )

    @app.exception_handler(IntegrityViolationError)
    async def integrity_handler(_, exc: IntegrityViolationError):
        return JSONResponse(
            status_code=409,
            content=_error_payload("INTEGRITY_VIOLATION", str(exc), {"type": exc.__class__.__name__}),
        )

    @app.exception_handler(ExportOperationalError)
    async def export_operational_handler(_, exc: ExportOperationalError):
        return JSONResponse(
            status_code=503,
            content=_error_payload("EXPORT_UNAVAILABLE", str(exc), {"type": exc.__class__.__name__}),
        )

    @app.exception_handler(DomainError)
    async def domain_error_handler(_, exc: DomainError):
        return JSONResponse(
            status_code=400,
            content=_error_payload("DOMAIN_ERROR", str(exc), {"type": exc.__class__.__name__}),
        )

    @app.exception_handler(HTTPException)
    async def http_error_handler(_, exc: HTTPException):
        detail = exc.detail if isinstance(exc.detail, str) else "HTTP error"
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_payload("HTTP_ERROR", detail, {"status_code": exc.status_code}),
        )
