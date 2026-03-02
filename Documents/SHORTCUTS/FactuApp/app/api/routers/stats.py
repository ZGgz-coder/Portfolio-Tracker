from fastapi import APIRouter, Depends
from app.api.deps import get_conn

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("")
def get_stats(conn=Depends(get_conn)):
    # 1. Resumen por estado — count + total para cada status
    by_status = conn.execute("""
        SELECT status,
               COUNT(*) as cnt,
               COALESCE(SUM(CAST(total AS REAL)), 0) as total_sum
        FROM invoices GROUP BY status
    """).fetchall()

    # 2. Ingresos mensuales — últimos 12 meses calendar (OFFICIAL + PAID)
    monthly = conn.execute("""
        SELECT strftime('%Y-%m', issue_date) as month,
               SUM(CAST(total AS REAL)) as total_sum
        FROM invoices
        WHERE status IN ('OFFICIAL','PAID')
          AND issue_date >= date('now', '-11 months', 'start of month')
        GROUP BY month ORDER BY month
    """).fetchall()

    # 3. Top 5 clientes por facturación (OFFICIAL + PAID)
    top_clients = conn.execute("""
        SELECT COALESCE(c.name, 'Sin cliente') as name,
               SUM(CAST(i.total AS REAL)) as total_sum,
               COUNT(*) as cnt
        FROM invoices i
        LEFT JOIN clients c ON i.client_id = c.id
        WHERE i.status IN ('OFFICIAL','PAID')
        GROUP BY i.client_id ORDER BY total_sum DESC LIMIT 5
    """).fetchall()

    return {
        "by_status": [
            {"status": r["status"], "count": r["cnt"], "total": round(r["total_sum"], 2)}
            for r in by_status
        ],
        "monthly_income": [
            {"month": r["month"], "total": round(r["total_sum"], 2)}
            for r in monthly
        ],
        "top_clients": [
            {"name": r["name"], "total": round(r["total_sum"], 2), "count": r["cnt"]}
            for r in top_clients
        ],
    }
