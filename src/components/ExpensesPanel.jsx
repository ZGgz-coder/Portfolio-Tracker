import { useEffect, useMemo, useState } from "react";

const META_KEY = "quantum-wealth-expenses-meta-v1";

function eur(value) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value || 0);
}

function mensualEq(g) {
  if (g.recurrencia === "Mensual") return Number(g.monto || 0);
  if (g.recurrencia === "Trimestral") return Number(g.monto || 0) / 3;
  if (g.recurrencia === "Anual") return Number(g.monto || 0) / 12;
  return Number(g.monto || 0);
}

function nextCharge(g) {
  const now = new Date();
  let y = now.getFullYear();
  let m = now.getMonth();
  const d = Math.min(Number(g.dia || 1), 28);
  let n = new Date(y, m, d);
  if (n < now) n = new Date(y, m + 1, d);
  if (g.recurrencia === "Trimestral") while (n < now) n = new Date(n.getFullYear(), n.getMonth() + 3, d);
  if (g.recurrencia === "Anual") while (n < now) n = new Date(n.getFullYear() + 1, n.getMonth(), d);
  return n;
}

function dd(n) {
  return Math.ceil((n - new Date()) / (1000 * 60 * 60 * 24));
}

export default function ExpensesPanel() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(() => {
    try {
      return { budget: 0, ...JSON.parse(localStorage.getItem(META_KEY) || "{}") };
    } catch {
      return { budget: 0 };
    }
  });

  const [form, setForm] = useState({ concepto: "", monto: "", categoria: "Streaming", recurrencia: "Mensual", dia: "", inicio: "", metodo: "" });

  const totalMes = useMemo(() => items.reduce((a, g) => a + mensualEq(g), 0), [items]);
  const totalAnio = totalMes * 12;
  const budgetPct = meta.budget > 0 ? Math.min(100, (totalMes / meta.budget) * 100) : 0;
  const proximos = useMemo(
    () => items.map((g) => ({ ...g, next: nextCharge(g) })).sort((a, b) => a.next - b.next).slice(0, 8),
    [items]
  );

  useEffect(() => {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  }, [meta]);

  async function reload() {
    const r = await fetch("/api/expenses");
    const json = await r.json();
    setItems(Array.isArray(json?.data) ? json.data : []);
  }

  useEffect(() => {
    reload();
  }, []);

  async function saveExpense(payload) {
    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  async function addItem(event) {
    event.preventDefault();
    if (!form.concepto || !form.monto) return;

    await saveExpense({
      id: crypto.randomUUID(),
      concepto: form.concepto.trim(),
      monto: Number(form.monto),
      categoria: form.categoria,
      recurrencia: form.recurrencia,
      dia: Number(form.dia || 1),
      inicio: form.inicio,
      metodo: form.metodo
    });

    setForm({ concepto: "", monto: "", categoria: form.categoria, recurrencia: form.recurrencia, dia: "", inicio: "", metodo: "" });
    await reload();
  }

  async function remove(id) {
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    await reload();
  }

  async function editAmount(item) {
    const next = prompt("Nuevo importe (€)", String(item.monto));
    if (next == null) return;
    const amount = Number(next);
    if (!Number.isFinite(amount) || amount <= 0) return;
    await saveExpense({ ...item, monto: amount });
    await reload();
  }

  return (
    <section className="glass card screen-panel expenses-panel">
      <h3>Gastos & Suscripciones</h3>

      <div className="expenses-summary">
        <div>
          <p className="mini-label">Total mensual</p>
          <strong>{eur(totalMes)}</strong>
        </div>
        <div>
          <p className="mini-label">Total anual</p>
          <strong>{eur(totalAnio)}</strong>
        </div>
        <div>
          <p className="mini-label">Suscripciones</p>
          <strong>{items.length}</strong>
        </div>
      </div>

      <div className="budget-wrap">
        <div className="budget-head">
          <p className="mini-label">Objetivo mensual</p>
          <input
            value={meta.budget || ""}
            onChange={(e) => setMeta((prev) => ({ ...prev, budget: Number(e.target.value || 0) }))}
            type="number"
            min="0"
            placeholder="300"
          />
        </div>
        <div className="budget-track">
          <span className={`budget-fill ${meta.budget && totalMes > meta.budget ? "over" : ""}`} style={{ width: `${budgetPct}%` }} />
        </div>
        <small>{eur(totalMes)} de {eur(meta.budget || 0)}</small>
      </div>

      <div className="expenses-split">
        <form className="form-grid" onSubmit={addItem}>
          <input placeholder="Concepto" value={form.concepto} onChange={(e) => setForm((f) => ({ ...f, concepto: e.target.value }))} />
          <input type="number" step="0.01" placeholder="Monto" value={form.monto} onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))} />
          <select value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}>
            <option>Streaming</option><option>Seguros</option><option>Cloud</option><option>IA</option><option>Vivienda</option><option>Otros</option>
          </select>
          <select value={form.recurrencia} onChange={(e) => setForm((f) => ({ ...f, recurrencia: e.target.value }))}>
            <option>Mensual</option><option>Trimestral</option><option>Anual</option>
          </select>
          <input type="number" min="1" max="31" placeholder="Día cobro" value={form.dia} onChange={(e) => setForm((f) => ({ ...f, dia: e.target.value }))} />
          <button type="submit">Agregar</button>
        </form>

        <div className="holding-list">
          {items.length === 0 ? <article className="glass card holding-row compact"><p>No hay suscripciones aún.</p></article> : null}
          {items.map((item) => {
            const days = dd(nextCharge(item));
            return (
              <article key={item.id} className="glass card holding-row compact">
                <div>
                  <p>{item.concepto}</p>
                  <small>{item.categoria} · {item.recurrencia} · día {item.dia}</small>
                </div>
                <div className="holding-price">
                  <strong>{eur(item.monto)}</strong>
                  <div className="expenses-actions">
                    <span className={`days-chip ${days <= 3 ? "red" : days <= 7 ? "yellow" : "green"}`}>{days}d</span>
                    <button type="button" className="ghost" onClick={() => editAmount(item)}>Editar</button>
                    <button type="button" className="danger" onClick={() => remove(item.id)}>Borrar</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <h3 className="inner-title">Próximos cobros</h3>
      <div className="holding-list">
        {proximos.map((p) => {
          const days = dd(p.next);
          return (
            <article key={`next-${p.id}`} className="glass card holding-row compact">
              <div>
                <p>{p.concepto}</p>
                <small>{p.next.toLocaleDateString("es-ES")}</small>
              </div>
              <strong className={days <= 3 ? "down" : days <= 7 ? "warn" : "up"}>{days} días</strong>
            </article>
          );
        })}
      </div>
    </section>
  );
}
