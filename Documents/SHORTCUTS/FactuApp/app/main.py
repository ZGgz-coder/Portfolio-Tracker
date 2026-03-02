from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api.error_handlers import register_error_handlers
from app.api.routers.clients import router as clients_router
from app.api.routers.health import router as health_router
from app.api.routers.invoices import router as invoices_router
from app.api.routers.stats import router as stats_router
from app.infrastructure.db.sqlite import init_db
from app.infrastructure.exporters.pro_template_generator import ensure_pro_template


def create_app() -> FastAPI:
    app = FastAPI(title="FactuApp")
    init_db()
    ensure_pro_template(Path(__file__).resolve().parents[1])
    register_error_handlers(app)
    app.include_router(health_router)
    app.include_router(clients_router)
    app.include_router(invoices_router)
    app.include_router(stats_router)

    static_dir = Path(__file__).parent / "ui" / "static"
    if static_dir.exists():
        app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
    return app


app = create_app()
