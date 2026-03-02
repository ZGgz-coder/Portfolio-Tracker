# Architecture

- `domain`: entities, value objects, invariants, status rules.
- `application`: use cases and orchestration.
- `infrastructure`: SQLite repositories, parser, exporters, storage.
- `api`: FastAPI endpoints and schemas.
- `ui`: simple HTML/JS client.

Key rule: official numbering is generated only in `officialize_invoice` using SQLite `BEGIN IMMEDIATE` transaction.
