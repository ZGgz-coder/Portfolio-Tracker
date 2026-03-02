import { useEffect, useMemo, useRef, useState } from "react";

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

const categoryColor = {
  Streaming: "#8b5cf6",
  Seguros: "#ff7d90",
  Cloud: "#25e2f4",
  IA: "#f5b54a",
  Vivienda: "#5b8cff",
  Otros: "#9ca3af"
};

function serviceEmoji(name = "") {
  const n = name.toLowerCase();
  if (n.includes("netflix")) return "🎬";
  if (n.includes("apple")) return "🍎";
  if (n.includes("google")) return "🔎";
  if (n.includes("claude")) return "🤖";
  if (n.includes("spotify")) return "🎵";
  if (n.includes("icloud")) return "☁️";
  return "💳";
}

function DaysBadge({ days }) {
  const cls = days <= 3 ? "red" : days <= 7 ? "yellow" : "green";
  return <span className={`days-chip ${cls}`}>{days}d</span>;
}

export default function ExpensesPanel() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ concepto: "", monto: "", categoria: "Streaming", recurrencia: "Mensual", dia: "", inicio: "", metodo: "" });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [budget, setBudget] = useState(() => Number(localStorage.getItem("qw-expenses-budget") || 0));
  const [simResult, setSimResult] = useState("Selecciona una suscripción para simular");
  const [chartTip, setChartTip] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("qw-expenses-budget", String(budget || 0));
  }, [budget]);

  async function reload() {
    const r = await fetch("/api/expenses");
    const json = await r.json();
    setItems(Array.isArray(json?.data) ? json.data : []);
  }

  useEffect(() => {
    reload();
  }, []);

  const sortedFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const dir = sortDir === "asc" ? 1 : -1;
    return items
      .filter((item) => item.concepto.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sortBy === "amount") return (a.monto - b.monto) * dir;
        if (sortBy === "category") return (a.categoria || "").localeCompare(b.categoria || "") * dir;
        if (sortBy === "next") return (nextCharge(a) - nextCharge(b)) * dir;
        return a.concepto.localeCompare(b.concepto) * dir;
      });
  }, [items, search, sortBy, sortDir]);

  const totalMes = useMemo(() => items.reduce((a, g) => a + mensualEq(g), 0), [items]);
  const totalAnio = totalMes * 12;
  const prevMes = totalMes * 0.93;
  const delta = totalMes - prevMes;
  const budgetPct = budget > 0 ? Math.min(100, (totalMes / budget) * 100) : 0;

  const upcoming = useMemo(
    () => items.map((g) => ({ ...g, next: nextCharge(g), days: dd(nextCharge(g)) })).sort((a, b) => a.next - b.next).slice(0, 10),
    [items]
  );

  const categoryBreakdown = useMemo(() => {
    const map = {};
    items.forEach((g) => {
      const key = g.categoria || "Otros";
      map[key] = (map[key] || 0) + mensualEq(g);
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, pct: (value / total) * 100 }))
      .sort((a, b) => b.value - a.value);
  }, [items]);

  const trendData = useMemo(() => {
    const base = totalMes || 1;
    const current = [0.92, 0.95, 0.98, 1.0, 1.03, 1.07].map((m) => base * m);
    const previous = current.map((v) => v * 0.92);
    return { current, previous };
  }, [totalMes]);

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
      metodo: form.metodo,
      rating: 0,
      history: []
    });

    setForm((f) => ({ ...f, concepto: "", monto: "", dia: "", inicio: "", metodo: "" }));
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
    const history = Array.isArray(item.history) ? [...item.history] : [];
    if (amount !== Number(item.monto)) {
      history.unshift({ date: new Date().toISOString(), from: Number(item.monto), to: amount });
    }
    await saveExpense({ ...item, monto: amount, history: history.slice(0, 10) });
    await reload();
  }

  async function setRating(item, rating) {
    await saveExpense({ ...item, rating });
    await reload();
  }

  async function syncLegacy() {
    await fetch("/api/expenses/sync-legacy", { method: "POST" });
    await reload();
  }

  function simulate(id) {
    const item = items.find((x) => x.id === id);
    if (!item) return;
    const monthly = mensualEq(item);
    const annual = monthly * 12;
    setSimResult(`Si cancelas “${item.concepto}”: ahorras ${eur(annual)}/año. Nuevo mensual: ${eur(totalMes - monthly)}.`);
  }

  function exportSummaryPng() {
    const c = document.createElement("canvas");
    c.width = 1000;
    c.height = 560;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "rgba(255,255,255,.2)";
    ctx.strokeRect(30, 30, 940, 500);
    ctx.fillStyle = "#f3f6ff";
    ctx.font = "700 36px Inter, Arial";
    ctx.fillText("Quantum Wealth · Resumen Gastos", 56, 84);
    ctx.font = "600 30px Inter, Arial";
    ctx.fillText(`Total mensual: ${eur(totalMes)}`, 56, 150);
    ctx.fillText(`Total anual: ${eur(totalAnio)}`, 56, 196);
    ctx.fillText(`Suscripciones activas: ${items.length}`, 56, 242);
    ctx.fillStyle = delta >= 0 ? "#ff9c9c" : "#9ef9cc";
    ctx.fillText(`Comparativa: ${delta >= 0 ? "▲" : "▼"} ${eur(Math.abs(delta))}`, 56, 288);
    ctx.fillStyle = "#9aa7c7";
    ctx.font = "500 18px Inter, Arial";
    ctx.fillText(new Date().toLocaleString("es-ES"), 56, 500);
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = "qw-gastos-resumen.png";
    a.click();
  }

  const months = ["M-5", "M-4", "M-3", "M-2", "M-1", "M"];
  const allVals = [...trendData.current, ...trendData.previous];
  const min = Math.min(...allVals) * 0.98;
  const max = Math.max(...allVals) * 1.02;
  const range = max - min || 1;
  const chartW = 540;
  const chartH = 220;
  const xStep = (chartW - 70) / 5;
  const toPoint = (v, i) => ({ x: 36 + i * xStep, y: chartH - 26 - ((v - min) / range) * (chartH - 64), value: v, index: i });
  const pCurrent = trendData.current.map(toPoint);
  const pPrev = trendData.previous.map(toPoint);

  const path = (pts) => pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  const area = `${path(pCurrent)} L ${pCurrent[pCurrent.length - 1].x} ${chartH - 26} L ${pCurrent[0].x} ${chartH - 26} Z`;

  return (
    <section className="glass card screen-panel expenses-panel">
      <h3>Gastos & Suscripciones</h3>

      <div className="expenses-summary">
        <div><p className="mini-label">Mensual</p><strong>{eur(totalMes)}</strong></div>
        <div><p className="mini-label">Anual</p><strong>{eur(totalAnio)}</strong></div>
        <div><p className="mini-label">Activas</p><strong>{items.length}</strong></div>
      </div>

      <div className="budget-wrap">
        <div className="budget-head">
          <p className="mini-label">Objetivo mensual</p>
          <input type="number" min="0" value={budget || ""} onChange={(e) => setBudget(Number(e.target.value || 0))} placeholder="300" />
          <button type="button" className="ghost" onClick={syncLegacy}>Sync DB gastos</button>
        </div>
        <div className="budget-track"><span className={`budget-fill ${budget && totalMes > budget ? "over" : ""}`} style={{ width: `${budgetPct}%` }} /></div>
        <small>{eur(totalMes)} de {eur(budget || 0)}</small>
      </div>

      <div className="relative-chart">
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="expenses-chart"
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * chartW;
            let target = pCurrent[0];
            pCurrent.forEach((p) => {
              if (Math.abs(p.x - x) < Math.abs(target.x - x)) target = p;
            });
            setChartTip({ x: target.x, y: target.y, label: months[target.index], value: target.value });
          }}
          onMouseLeave={() => setChartTip(null)}
        >
          <defs>
            <linearGradient id="expensesArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(37,226,244,0.34)" />
              <stop offset="100%" stopColor="rgba(37,226,244,0.03)" />
            </linearGradient>
          </defs>
          {[0.2, 0.4, 0.6, 0.8].map((line) => (
            <line key={line} x1="28" y1={18 + line * (chartH - 58)} x2={chartW - 16} y2={18 + line * (chartH - 58)} stroke="rgba(255,255,255,.1)" strokeDasharray="4 6" />
          ))}
          <path d={area} fill="url(#expensesArea)" />
          <path d={path(pPrev)} fill="none" stroke="rgba(242,201,76,.92)" strokeWidth="2" strokeDasharray="6 6" />
          <path d={path(pCurrent)} fill="none" stroke="rgba(127,91,255,1)" strokeWidth="3" />
          {pCurrent.map((p) => <circle key={`cp-${p.index}`} cx={p.x} cy={p.y} r="3.6" fill="#25e2f4" />)}
          {months.map((label, i) => (
            <text key={label} x={36 + i * xStep - 10} y={chartH - 8} fill="rgba(223,242,244,.65)" fontSize="11">{label}</text>
          ))}
        </svg>
        {chartTip ? (
          <div className="chart-tip" style={{ left: `${(chartTip.x / chartW) * 100}%`, top: `${(chartTip.y / chartH) * 100}%` }}>
            <b>{chartTip.label}</b><br />{eur(chartTip.value)}
          </div>
        ) : null}
      </div>

      <div className="category-grid">
        {categoryBreakdown.map((c) => (
          <div key={c.name} className="category-item">
            <div className="row-head"><span className="dot" style={{ background: categoryColor[c.name] || "#9ca3af" }} /> {c.name} <small>{eur(c.value)} ({c.pct.toFixed(1)}%)</small></div>
            <div className="track"><span className="fill" style={{ width: `${c.pct}%`, background: categoryColor[c.name] || "#9ca3af" }} /></div>
          </div>
        ))}
      </div>

      <div className="row controls-row">
        <input placeholder="Buscar suscripción..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="name">Nombre</option><option value="amount">Importe</option><option value="category">Categoría</option><option value="next">Próx. cobro</option>
        </select>
      </div>
      <div className="row controls-row" style={{ marginTop: 8 }}>
        <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}><option value="asc">Asc</option><option value="desc">Desc</option></select>
        <select onChange={(e) => simulate(e.target.value)} defaultValue="">
          <option value="">Simulador anual</option>
          {items.map((item) => <option key={`sim-${item.id}`} value={item.id}>{item.concepto}</option>)}
        </select>
      </div>
      <p className="mini-label" style={{ marginTop: 8 }}>{simResult}</p>

      <div className="expenses-split">
        <form className="form-grid" onSubmit={addItem}>
          <input placeholder="Concepto" value={form.concepto} onChange={(e) => setForm((f) => ({ ...f, concepto: e.target.value }))} />
          <input type="number" step="0.01" placeholder="Monto" value={form.monto} onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))} />
          <select value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}><option>Streaming</option><option>Seguros</option><option>Cloud</option><option>IA</option><option>Vivienda</option><option>Otros</option></select>
          <select value={form.recurrencia} onChange={(e) => setForm((f) => ({ ...f, recurrencia: e.target.value }))}><option>Mensual</option><option>Trimestral</option><option>Anual</option></select>
          <input type="number" min="1" max="31" placeholder="Día cobro" value={form.dia} onChange={(e) => setForm((f) => ({ ...f, dia: e.target.value }))} />
          <button type="submit">Agregar suscripción</button>
        </form>

        <div className="holding-list">
          {sortedFiltered.length === 0 ? <article className="glass card holding-row compact"><p>No hay suscripciones.</p></article> : null}
          {sortedFiltered.map((item) => {
            const days = dd(nextCharge(item));
            const historyTop = Array.isArray(item.history) && item.history[0] ? item.history[0] : null;
            return (
              <article key={item.id} className="glass card holding-row compact expense-row">
                <div>
                  <p>{serviceEmoji(item.concepto)} {item.concepto}</p>
                  <small>{item.categoria} · {item.recurrencia} · día {item.dia}</small>
                  {historyTop ? <small>↗ subió {eur(historyTop.to - historyTop.from)} en {new Date(historyTop.date).toLocaleDateString("es-ES", { month: "short", year: "numeric" })}</small> : null}
                </div>
                <div className="holding-price">
                  <strong>{eur(item.monto)}</strong>
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={`${item.id}-${n}`} onClick={() => setRating(item, n)}>{n <= Number(item.rating || 0) ? "★" : "☆"}</span>
                    ))}
                  </div>
                  <div className="expenses-actions">
                    <DaysBadge days={days} />
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
        {upcoming.map((item) => (
          <article key={`up-${item.id}`} className="glass card holding-row compact">
            <div>
              <p>{item.concepto}</p>
              <small>{item.next.toLocaleDateString("es-ES")}</small>
            </div>
            <div className="expenses-actions"><DaysBadge days={item.days} /><strong>{eur(item.monto)}</strong></div>
          </article>
        ))}
      </div>

      <div className="actions" style={{ marginTop: 10 }}>
        <button type="button" onClick={exportSummaryPng}>Exportar resumen PNG</button>
      </div>
    </section>
  );
}
