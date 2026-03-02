from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends

from app.api.deps import get_client_repo, get_conn
from app.api.schemas.client_requests import CreateClientRequest, UpdateClientRequest
from app.domain.entities.client import Client
from app.domain.rules.invoice_invariants import NotFoundError

router = APIRouter(prefix="/api/clients", tags=["clients"])


def _to_client_dict(client: Client) -> dict:
    return {
        "id": client.id,
        "name": client.name,
        "tax_id": client.tax_id,
        "email": client.email,
        "phone": client.phone,
        "address": client.address,
        "city": client.city,
        "postal_code": client.postal_code,
        "province": client.province,
    }


@router.post("")
def create_client(payload: CreateClientRequest, conn=Depends(get_conn)):
    repo = get_client_repo(conn)
    client = Client(
        id=str(uuid4()),
        name=payload.name,
        tax_id=payload.tax_id,
        email=payload.email,
        phone=payload.phone,
        address=payload.address,
        city=payload.city,
        postal_code=payload.postal_code,
        province=payload.province,
    )
    repo.create(client)
    return {"data": _to_client_dict(client)}


@router.get("")
def list_clients(search: str | None = None, conn=Depends(get_conn)):
    repo = get_client_repo(conn)
    return {"data": [_to_client_dict(c) for c in repo.list(search=search)]}


@router.get("/{client_id}")
def get_client(client_id: str, conn=Depends(get_conn)):
    repo = get_client_repo(conn)
    client = repo.get(client_id)
    if not client:
        raise NotFoundError("Client not found")
    return {"data": _to_client_dict(client)}


@router.put("/{client_id}")
def update_client(client_id: str, payload: UpdateClientRequest, conn=Depends(get_conn)):
    repo = get_client_repo(conn)
    current = repo.get(client_id)
    if not current:
        raise NotFoundError("Client not found")

    updated = Client(
        id=client_id,
        name=payload.name,
        tax_id=payload.tax_id,
        email=payload.email,
        phone=payload.phone,
        address=payload.address,
        city=payload.city,
        postal_code=payload.postal_code,
        province=payload.province,
    )
    repo.update(updated)
    return {"data": _to_client_dict(updated)}
