import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "quantum-wealth-holdings-v2";

const NAV_ITEMS = [
  { id: "control", label: "Inicio", icon: "home" },
  { id: "wealth", label: "Patrimonio", icon: "wallet" },
  { id: "markets", label: "Mercados", icon: "chart" },
  { id: "strategy", label: "Plan", icon: "target" },
  { id: "settings", label: "Ajustes", icon: "settings" }
];

const RANGE_OPTIONS = ["1D", "1M", "1Y"];

const CHART_SERIES = {
  "1D": {
    values: [0.992, 1.001, 0.998, 1.004, 1.011, 1.008, 1.016, 1.021, 1.019, 1.026, 1.031, 1.028, 1.036, 1.041, 1.037, 1.043, 1.049, 1.046, 1.053, 1.059, 1.055, 1.062, 1.069, 1.074],
    ticks: [
      { index: 0, label: "00h" },
      { index: 4, label: "04h" },
      { index: 8, label: "08h" },
      { index: 12, label: "12h" },
      { index: 16, label: "16h" },
      { index: 20, label: "20h" },
      { index: 23, label: "24h" }
    ]
  },
  "1M": {
    values: [0.92, 0.93, 0.94, 0.955, 0.949, 0.963, 0.97, 0.966, 0.978, 0.989, 0.995, 0.991, 1.006, 1.017, 1.009, 1.024, 1.032, 1.028, 1.041, 1.049, 1.044, 1.058, 1.068, 1.061, 1.077, 1.082, 1.076, 1.093, 1.1, 1.109],
    ticks: [
      { index: 0, label: "D1" },
      { index: 5, label: "D6" },
      { index: 10, label: "D11" },
      { index: 15, label: "D16" },
      { index: 20, label: "D21" },
      { index: 25, label: "D26" },
      { index: 29, label: "D30" }
    ]
  },
  "1Y": {
    values: [0.88, 0.9, 0.93, 0.96, 0.98, 1.01, 1.05, 1.03, 1.08, 1.12, 1.18, 1.24],
    ticks: [
      { index: 0, label: "JAN" },
      { index: 2, label: "MAR" },
      { index: 4, label: "MAY" },
      { index: 6, label: "JUL" },
      { index: 8, label: "SEP" },
      { index: 10, label: "NOV" },
      { index: 11, label: "DEC" }
    ]
  }
};

const marketWatch = [
  { ticker: "BTC", name: "Bitcoin", value: 64210, change: 2.4 },
  { ticker: "AAPL", name: "Apple Inc.", value: 189.42, change: -0.8 },
  { ticker: "ETH", name: "Ethereum", value: 3452.12, change: 5.1 }
];

const insights = [
  { id: "i1", kind: "Mejor rendimiento", title: "Bitcoin (BTC)", note: "Supera la volatilidad de 7 días en 12.4%.", tone: "primary" },
  { id: "i2", kind: "Acción requerida", title: "Rebalancear acciones", note: "AAPL ahora representa el 22% del portfolio de acciones.", tone: "purple" }
];

const bankAccounts = [
  { id: "b1", name: "Santander Everyday", type: "Cuenta corriente", balance: 46200 },
  { id: "b2", name: "BBVA Reserve", type: "Ahorro", balance: 54500 },
  { id: "b3", name: "Revolut Cash", type: "Efectivo", balance: 23300 }
];

const equityEtfPositions = [
  { id: "e1", name: "AAPL", marketValue: 37200 },
  { id: "e2", name: "MSFT", marketValue: 33600 },
  { id: "e3", name: "SPY", marketValue: 41100 },
  { id: "e4", name: "QQQ", marketValue: 29800 }
];

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value || 0);
}

function pct(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function loadHoldings() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        typeof item?.symbol === "string" &&
        Number.isFinite(item?.quantity) &&
        Number.isFinite(item?.avgPrice) &&
        Number.isFinite(item?.currentPrice)
    );
  } catch {
    return [];
  }
}

function saveHoldings(holdings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
}

function parseCsvLine(line) {
  const out = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  out.push(current.trim());
  return out;
}

function parseHoldingsCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map((item) =>
    item
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "")
  );

  const indexOf = (candidates) =>
    candidates.map((candidate) => header.indexOf(candidate)).find((index) => index >= 0) ?? -1;

  const symbolIndex = indexOf(["symbol", "asset", "ticker", "coin"]);
  const quantityIndex = indexOf(["quantity", "amount", "volume", "holdings"]);
  const avgPriceIndex = indexOf(["avgprice", "averageprice", "buyprice", "costbasis"]);
  const currentPriceIndex = indexOf(["currentprice", "price", "last", "markprice"]);

  if (symbolIndex < 0 || quantityIndex < 0 || avgPriceIndex < 0) return [];

  return lines
    .slice(1)
    .map((line) => parseCsvLine(line))
    .map((cols) => ({
      symbol: String(cols[symbolIndex] || "").trim().toUpperCase(),
      quantity: Number(cols[quantityIndex] || 0),
      avgPrice: Number(cols[avgPriceIndex] || 0),
      currentPrice:
        currentPriceIndex >= 0 ? Number(cols[currentPriceIndex] || 0) : Number(cols[avgPriceIndex] || 0)
    }))
    .filter(
      (item) =>
        item.symbol &&
        Number.isFinite(item.quantity) &&
        Number.isFinite(item.avgPrice) &&
        Number.isFinite(item.currentPrice) &&
        item.quantity > 0 &&
        item.avgPrice > 0 &&
        item.currentPrice > 0
    );
}

function smoothPath(points) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const cx = ((previous.x + current.x) / 2).toFixed(2);
    path += ` Q ${cx} ${previous.y.toFixed(2)}, ${current.x.toFixed(2)} ${current.y.toFixed(2)}`;
  }
  return path;
}

function NavIcon({ name }) {
  if (name === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 11.5 12 5l8 6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.5 10.5V19h11v-8.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "wallet") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5v7A2.5 2.5 0 0 1 17.5 18h-11A2.5 2.5 0 0 1 4 15.5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 12h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "chart") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 19V5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M5 19h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="m8 14 3-3 3 2 4-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "target") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 4v2.5M12 17.5V20M4 12h2.5M17.5 12H20M6.6 6.6l1.7 1.7M15.7 15.7l1.7 1.7M17.4 6.6l-1.7 1.7M8.3 15.7l-1.7 1.7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function resampleSeries(series, targetLength) {
  if (targetLength <= 0) return [];
  if (series.length === 0) return Array.from({ length: targetLength }, () => 0);
  if (series.length === 1) return Array.from({ length: targetLength }, () => series[0]);

  return Array.from({ length: targetLength }, (_, index) => {
    const ratio = targetLength === 1 ? 0 : index / (targetLength - 1);
    const sourcePosition = ratio * (series.length - 1);
    const low = Math.floor(sourcePosition);
    const high = Math.min(series.length - 1, low + 1);
    const weight = sourcePosition - low;
    return series[low] + (series[high] - series[low]) * weight;
  });
}

export default function App() {
  const [screen, setScreen] = useState("control");
  const [timeframe, setTimeframe] = useState("1M");
  const [chartValues, setChartValues] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [holdings, setHoldings] = useState(() => loadHoldings());
  const [allocationFocus, setAllocationFocus] = useState("all");
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [csvSource, setCsvSource] = useState("CMC");
  const [csvFileName, setCsvFileName] = useState("");
  const [message, setMessage] = useState("Sigue y ajusta tus posiciones.");
  const chartValuesRef = useRef([]);
  const animationRef = useRef(null);

  const rows = useMemo(
    () =>
      holdings.map((item) => {
        const invested = item.quantity * item.avgPrice;
        const marketValue = item.quantity * item.currentPrice;
        const pnl = marketValue - invested;
        const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
        return { ...item, invested, marketValue, pnl, pnlPct };
      }),
    [holdings]
  );

  const bankTotal = bankAccounts.reduce((sum, item) => sum + item.balance, 0);
  const cryptoTotal = rows.reduce((sum, item) => sum + item.marketValue, 0);
  const defaultDigitalAssetsTotal = 128400;
  const hasCustomDigitalAssets = cryptoTotal > 0;
  const digitalAssetsTotal = hasCustomDigitalAssets ? cryptoTotal : defaultDigitalAssetsTotal;
  const equitiesEtfTotal = equityEtfPositions.reduce((sum, item) => sum + item.marketValue, 0);
  const allocationTotal = bankTotal + digitalAssetsTotal + equitiesEtfTotal;
  const netWorth = allocationTotal;
  const liquidityPct = allocationTotal > 0 ? (bankTotal / allocationTotal) * 100 : 0;
  const cryptoPct = allocationTotal > 0 ? (digitalAssetsTotal / allocationTotal) * 100 : 0;
  const equitiesPct = allocationTotal > 0 ? (equitiesEtfTotal / allocationTotal) * 100 : 0;
  const digitalAssetsDelta = hasCustomDigitalAssets
    ? rows.reduce((sum, item) => sum + item.pnl / 10, 0)
    : digitalAssetsTotal * 0.0022;
  const todayDelta =
    digitalAssetsDelta +
    bankTotal * 0.003 +
    equitiesEtfTotal * 0.0012;
  const allocationItems = [
    { key: "liquidity", label: "Liquidez", pct: liquidityPct, amount: bankTotal },
    { key: "crypto", label: "Activos digitales", pct: cryptoPct, amount: digitalAssetsTotal },
    { key: "equities", label: "Acc/ETF", pct: equitiesPct, amount: equitiesEtfTotal }
  ];
  const topMovers = useMemo(() => {
    const dynamic = rows.map((item) => ({
      name: item.symbol,
      change: item.pnlPct,
      amount: item.marketValue
    }));

    const fallback = marketWatch.map((item) => ({
      name: item.ticker,
      change: item.change,
      amount: item.value
    }));

    return (dynamic.length > 0 ? dynamic : fallback)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 3);
  }, [rows]);

  const largestPosition = useMemo(() => {
    const all = [
      ...rows.map((item) => ({ name: item.symbol, value: item.marketValue })),
      ...equityEtfPositions.map((item) => ({ name: item.name, value: item.marketValue }))
    ];
    if (all.length === 0) return { name: "-", value: 0, pct: 0 };
    const best = all.sort((a, b) => b.value - a.value)[0];
    return {
      ...best,
      pct: allocationTotal > 0 ? (best.value / allocationTotal) * 100 : 0
    };
  }, [rows, allocationTotal]);

  const mainAlert = useMemo(() => {
    if (cryptoPct > 45) return "Exposición cripto alta: considera rebalanceo parcial.";
    if (liquidityPct < 12) return "Liquidez baja: aumenta caja para reducir riesgo.";
    if (largestPosition.pct > 28) {
      return `Concentración elevada en ${largestPosition.name} (${largestPosition.pct.toFixed(1)}%).`;
    }
    return "Portfolio equilibrado: no hay alertas críticas ahora mismo.";
  }, [cryptoPct, liquidityPct, largestPosition]);

  const dashboardActivity = useMemo(
    () => [
      { title: "Activos en cartera", detail: `${rows.length + equityEtfPositions.length} posiciones` },
      { title: "Liquidez disponible", detail: money(bankTotal) },
      { title: "Delta estimado hoy", detail: `${money(todayDelta)} (${pct((todayDelta / (netWorth || 1)) * 100)})` }
    ],
    [rows.length, bankTotal, todayDelta, netWorth]
  );

  const targetChartValues = useMemo(() => {
    const config = CHART_SERIES[timeframe];
    const baseline = Math.max(netWorth * 0.76, 120000);
    return config.values.map((factor) => baseline * factor);
  }, [timeframe, netWorth]);

  useEffect(() => {
    chartValuesRef.current = chartValues;
  }, [chartValues]);

  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    const previous = chartValuesRef.current;
    if (previous.length === 0) {
      setChartValues(targetChartValues);
      return undefined;
    }

    const from = resampleSeries(previous, targetChartValues.length);
    const to = targetChartValues;
    const duration = 520;
    let start = null;
    const easeOutCubic = (t) => 1 - ((1 - t) ** 3);

    const animate = (timestamp) => {
      if (start === null) start = timestamp;
      const progress = Math.min(1, (timestamp - start) / duration);
      const eased = easeOutCubic(progress);
      const frame = to.map((value, index) => from[index] + (value - from[index]) * eased);
      setChartValues(frame);
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [targetChartValues]);

  const chart = useMemo(() => {
    const config = CHART_SERIES[timeframe];
    const values = chartValues.length > 0 ? chartValues : targetChartValues;
    const width = 360;
    const height = 170;
    const low = Math.min(...values) * 0.995;
    const high = Math.max(...values) * 1.005;
    const spread = high - low || 1;
    const step = width / (values.length - 1 || 1);

    const points = values.map((value, index) => {
      const x = index * step;
      const normalized = (value - low) / spread;
      const y = height - normalized * height;
      return { x, y, value, index };
    });

    const volume = values.map((value, index) => {
      const prev = index === 0 ? value : values[index - 1];
      const change = Math.abs((value - prev) / prev);
      return Math.min(0.95, 0.24 + change * 22 + ((index % 3) * 0.05));
    });

    const line = smoothPath(points);
    const area = `${line} L ${width} ${height} L 0 ${height} Z`;
    const latest = points[points.length - 1];
    const start = points[0];
    const changePct = ((latest.value - start.value) / start.value) * 100;

    return {
      width,
      height,
      points,
      volume,
      line,
      area,
      latest,
      ticks: config.ticks,
      low,
      high,
      changePct
    };
  }, [timeframe, chartValues, targetChartValues]);

  const hoveredPoint = hoveredIndex === null ? null : chart.points[hoveredIndex] || null;
  const focusPoint = hoveredPoint || chart.latest;
  const focusLabel = useMemo(() => {
    if (!focusPoint) return "";
    const total = chart.points.length || 1;
    if (timeframe === "1D") {
      const hour = Math.round((focusPoint.index / (total - 1)) * 24);
      return `${String(Math.min(24, Math.max(0, hour))).padStart(2, "0")}:00`;
    }
    if (timeframe === "1M") {
      const day = Math.round((focusPoint.index / (total - 1)) * 29) + 1;
      return `Día ${Math.min(30, Math.max(1, day))}`;
    }
    return CHART_SERIES["1Y"].ticks.find((tick) => tick.index === focusPoint.index)?.label || `Mes ${focusPoint.index + 1}`;
  }, [focusPoint, timeframe, chart.points.length]);
  const tooltipLeftPct = focusPoint ? Math.min(88, Math.max(12, (focusPoint.x / chart.width) * 100)) : 50;
  const tooltipTopPx = focusPoint ? Math.min(118, Math.max(10, (focusPoint.y / chart.height) * 170 - 54)) : 10;
  const prevPoint = focusPoint && focusPoint.index > 0 ? chart.points[focusPoint.index - 1] : null;
  const tooltipDelta = prevPoint ? ((focusPoint.value - prevPoint.value) / prevPoint.value) * 100 : chart.changePct;

  const handleChartPointer = (event) => {
    if (!chart.points.length) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const x = ((event.clientX - rect.left) / rect.width) * chart.width;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    chart.points.forEach((point, index) => {
      const distance = Math.abs(point.x - x);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    setHoveredIndex(nearestIndex);
  };

  const submitHolding = (event) => {
    event.preventDefault();

    const cleanSymbol = symbol.trim().toUpperCase();
    const qty = Number(quantity);
    const avg = Number(avgPrice);
    const current = Number(currentPrice);

    if (!cleanSymbol || qty <= 0 || avg <= 0 || current <= 0) {
      setMessage("Completa todos los campos con valores válidos.");
      return;
    }

    const next = [
      ...holdings.filter((item) => item.symbol !== cleanSymbol),
      { symbol: cleanSymbol, quantity: qty, avgPrice: avg, currentPrice: current }
    ].sort((a, b) => a.symbol.localeCompare(b.symbol));

    setHoldings(next);
    saveHoldings(next);
    setMessage(`Guardado ${cleanSymbol}`);
    setSymbol("");
    setQuantity("");
    setAvgPrice("");
    setCurrentPrice("");
  };

  const removeHolding = (targetSymbol) => {
    const next = holdings.filter((item) => item.symbol !== targetSymbol);
    setHoldings(next);
    saveHoldings(next);
    setMessage(`Eliminado ${targetSymbol}`);
  };

  const importHoldingsCsv = async (file) => {
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseHoldingsCsv(text);

      if (parsed.length === 0) {
        setMessage("No se detectaron holdings válidos en el CSV.");
        setCsvFileName(file.name);
        return;
      }

      const merged = new Map();
      [...holdings, ...parsed].forEach((item) => {
        merged.set(item.symbol, item);
      });

      const next = Array.from(merged.values()).sort((a, b) => a.symbol.localeCompare(b.symbol));
      setHoldings(next);
      saveHoldings(next);
      setCsvFileName(file.name);
      setMessage(`Importados ${parsed.length} holdings desde ${csvSource}.`);
    } catch {
      setMessage("Error leyendo el archivo CSV.");
    }
  };

  return (
    <main className="app-shell">
      <div className="aurora-bg" />

      <header className="topbar glass">
        <div className="profile-block">
          <div className="avatar">QW</div>
          <div>
            <p className="mini-label">Buenos días</p>
            <h2>Bienvenido de nuevo</h2>
          </div>
        </div>
        <button className="icon-btn" type="button">◎</button>
      </header>

      {screen === "control" ? (
        <>
          <section className="net-worth">
            <p className="section-label">Patrimonio neto total</p>
            <h1>
              {money(netWorth).split(".")[0]}
              <span>.{money(netWorth).split(".")[1] || "00"}</span>
            </h1>
            <div className="delta-pill up">{money(todayDelta)} ({pct((todayDelta / (netWorth || 1)) * 100)}) hoy</div>
          </section>

          <section className="kpi-strip">
            <article className="glass card kpi-card">
              <p className="mini-label">PnL No Realizado</p>
              <strong className={rows.reduce((sum, item) => sum + item.pnl, 0) >= 0 ? "up" : "down"}>
                {money(rows.reduce((sum, item) => sum + item.pnl, 0))}
              </strong>
            </article>
            <article className="glass card kpi-card">
              <p className="mini-label">Mayor Posición</p>
              <strong>{largestPosition.name}</strong>
              <small>{largestPosition.pct.toFixed(1)}%</small>
            </article>
            <article className="glass card kpi-card">
              <p className="mini-label">% Liquidez</p>
              <strong>{liquidityPct.toFixed(1)}%</strong>
            </article>
          </section>

          <section className="glass card chart-card">
            <div className="chart-head">
              <div>
                <p className="mini-label">Evolución del portfolio</p>
                <h3>Rendimiento {timeframe}</h3>
              </div>
              <div className="range-pills">
                {RANGE_OPTIONS.map((range) => (
                  <button
                    key={range}
                    type="button"
                    className={range === timeframe ? "active" : ""}
                    onClick={() => setTimeframe(range)}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="chart-stats">
              <span>{money(chart.latest.value)}</span>
              <span className={chart.changePct >= 0 ? "up" : "down"}>{pct(chart.changePct)}</span>
              <small>Rango {money(chart.low)} - {money(chart.high)}</small>
            </div>
            <div className="chart-plot">
              <svg
                viewBox={`0 0 ${chart.width} ${chart.height}`}
                preserveAspectRatio="none"
                role="img"
                aria-label="Portfolio growth chart"
                onPointerMove={handleChartPointer}
                onPointerDown={handleChartPointer}
                onPointerLeave={() => setHoveredIndex(null)}
              >
                <defs>
                  <linearGradient id="growthFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(37, 226, 244, 0.42)" />
                    <stop offset="100%" stopColor="rgba(37, 226, 244, 0)" />
                  </linearGradient>
                  <linearGradient id="volumeFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(139, 92, 246, 0.24)" />
                    <stop offset="100%" stopColor="rgba(139, 92, 246, 0.02)" />
                  </linearGradient>
                </defs>

                {[0.2, 0.4, 0.6, 0.8].map((line) => (
                  <line
                    key={line}
                    x1="0"
                    y1={(chart.height * line).toFixed(2)}
                    x2={chart.width}
                    y2={(chart.height * line).toFixed(2)}
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="4 8"
                  />
                ))}

                {chart.points.map((point, index) => {
                  const barWidth = Math.max(4, chart.width / chart.points.length - 5);
                  const barHeight = chart.height * chart.volume[index] * 0.35;
                  const x = Math.max(0, point.x - barWidth / 2);
                  const y = chart.height - barHeight;
                  return (
                    <rect
                      key={`vol-${point.index}`}
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="2"
                      fill="url(#volumeFill)"
                    />
                  );
                })}

                <path d={chart.area} fill="url(#growthFill)" />
                <path
                  key={`glow-${timeframe}`}
                  d={chart.line}
                  className="chart-line-glow chart-line-draw"
                  pathLength="1"
                  fill="none"
                  stroke="rgba(37, 226, 244, 0.2)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <path
                  key={`line-${timeframe}`}
                  d={chart.line}
                  className="chart-line-main chart-line-draw"
                  pathLength="1"
                  fill="none"
                  stroke="#25e2f4"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {focusPoint ? (
                  <g className="chart-focus">
                    <line
                      x1={focusPoint.x}
                      y1="0"
                      x2={focusPoint.x}
                      y2={chart.height}
                      stroke="rgba(201, 241, 247, 0.35)"
                      strokeDasharray="3 7"
                    />
                    <circle cx={focusPoint.x} cy={focusPoint.y} r="11" fill="rgba(37, 226, 244, 0.16)" />
                    <circle cx={focusPoint.x} cy={focusPoint.y} r="5.5" fill="#25e2f4" />
                  </g>
                ) : null}

                <circle className="chart-point-pulse" cx={chart.latest.x} cy={chart.latest.y} r="12" fill="rgba(37, 226, 244, 0.1)" />
              </svg>
              {focusPoint ? (
                <div
                  className="chart-tooltip-card"
                  style={{ left: `${tooltipLeftPct}%`, top: `${tooltipTopPx}px` }}
                >
                  <p>{focusLabel}</p>
                  <strong>{money(focusPoint.value)}</strong>
                  <span className={tooltipDelta >= 0 ? "up" : "down"}>
                    {pct(tooltipDelta)}
                  </span>
                </div>
              ) : null}
              <div className="chart-axis">
                {chart.ticks.map((tick) => (
                  <span key={`${timeframe}-${tick.label}`}>{tick.label}</span>
                ))}
              </div>
            </div>
          </section>

          <section className="mix-section">
            <h3 className="section-subtitle">Desglose de asignación</h3>
            <div className="glass card allocation-pill">
              <div className="allocation-bar" aria-label="Distribución del patrimonio">
                {allocationItems.map((item) => (
                  <span
                    key={`seg-${item.key}`}
                    className={`segment ${item.key} ${allocationFocus !== "all" && allocationFocus !== item.key ? "is-dimmed" : ""} ${allocationFocus === item.key ? "is-focused" : ""}`}
                    style={{ width: `${item.pct}%` }}
                  />
                ))}
              </div>
              <p className="allocation-summary">
                Liquidez {liquidityPct.toFixed(0)}% · Activos digitales {cryptoPct.toFixed(0)}% · Acc/ETF {equitiesPct.toFixed(0)}%
              </p>
              <div className="allocation-legend" aria-label="Leyenda de asignación">
                {allocationItems.map((item) => (
                  <button
                    key={`legend-${item.key}`}
                    type="button"
                    className={`allocation-legend-item ${allocationFocus === item.key ? "is-active" : ""}`}
                    onMouseEnter={() => setAllocationFocus(item.key)}
                    onMouseLeave={() => setAllocationFocus("all")}
                    onClick={() => setAllocationFocus((current) => (current === item.key ? "all" : item.key))}
                  >
                    <span className={`dot ${item.key}`} />
                    <span className="label">{item.label}</span>
                    <span className="value">{item.pct.toFixed(0)}%</span>
                  </button>
                ))}
              </div>
              <p className="allocation-amounts">
                {money(bankTotal)} · {money(digitalAssetsTotal)} · {money(equitiesEtfTotal)}
              </p>
            </div>
          </section>

          <section className="quick-grid">
            <article className="glass card compact-card">
              <h3 className="section-subtitle">Top movimientos</h3>
              <div className="holding-list">
                {topMovers.map((item) => (
                  <article key={`${item.name}-${item.change}`} className="glass card holding-row compact">
                    <div>
                      <p>{item.name}</p>
                      <small>{money(item.amount)}</small>
                    </div>
                    <span className={item.change >= 0 ? "up" : "down"}>{pct(item.change)}</span>
                  </article>
                ))}
              </div>
            </article>

            <article className="glass card compact-card">
              <h3 className="section-subtitle">Riesgo rápido</h3>
              <div className="holding-list">
                <article className="glass card holding-row compact">
                  <div><p>Concentración máx.</p><small>{largestPosition.name}</small></div>
                  <strong>{largestPosition.pct.toFixed(1)}%</strong>
                </article>
                <article className="glass card holding-row compact">
                  <div><p>Liquidez</p><small>Cash disponible</small></div>
                  <strong>{liquidityPct.toFixed(1)}%</strong>
                </article>
              </div>
            </article>
          </section>

          <section className="quick-grid">
            <article className="glass card compact-card">
              <h3 className="section-subtitle">Alerta principal</h3>
              <p className="insight-single">{mainAlert}</p>
            </article>
            <article className="glass card compact-card">
              <h3 className="section-subtitle">Acciones rápidas</h3>
              <div className="action-list compact">
                <button type="button" className="ghost action-btn" onClick={() => setScreen("settings")}>
                  Añadir/Importar datos
                </button>
                <button type="button" className="ghost action-btn" onClick={() => setScreen("wealth")}>
                  Ver patrimonio
                </button>
                <button type="button" className="ghost action-btn" onClick={() => setScreen("markets")}>
                  Revisar mercados
                </button>
              </div>
            </article>
          </section>

          <section className="insights-section">
            <h3 className="section-subtitle">Actividad reciente</h3>
            <div className="holding-list">
              {dashboardActivity.map((item) => (
                <article key={item.title} className="glass card holding-row compact">
                  <div>
                    <p>{item.title}</p>
                    <small>{item.detail}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {screen === "wealth" ? (
        <section className="glass card screen-panel">
          <h3>Cuentas de patrimonio</h3>
          <div className="holding-list">
            {bankAccounts.map((account) => (
              <article key={account.id} className="glass card holding-row compact">
                <div>
                  <p>{account.name}</p>
                  <small>{account.type}</small>
                </div>
                <strong>{money(account.balance)}</strong>
              </article>
            ))}
          </div>

          <h3 className="inner-title">Activos digitales en cartera</h3>
          <div className="holding-list">
            {rows.length === 0 ? (
              <article className="glass card holding-row compact">
                <p>No hay holdings cargados todavía.</p>
              </article>
            ) : (
              rows.map((item) => (
                <article key={item.symbol} className="glass card holding-row compact">
                  <div>
                    <p>{item.symbol}</p>
                    <small>{item.quantity}</small>
                  </div>
                  <div className="holding-price">
                    <strong>{money(item.marketValue)}</strong>
                    <span className={item.pnl >= 0 ? "up" : "down"}>{pct(item.pnlPct)}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      ) : null}

      {screen === "markets" ? (
        <section className="glass card screen-panel">
          <h3>Mercados</h3>
          <div className="holding-list">
            {marketWatch.map((item) => (
              <article key={item.ticker} className="glass card holding-row compact">
                <div>
                  <p>{item.name}</p>
                  <small>{item.ticker}</small>
                </div>
                <div className="holding-price">
                  <strong>{item.value > 1000 ? money(item.value) : String(item.value)}</strong>
                  <span className={item.change >= 0 ? "up" : "down"}>{pct(item.change)}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {screen === "strategy" ? (
        <section className="glass card screen-panel">
          <h3>Estrategia</h3>
          <div className="holding-list">
            <article className="glass card holding-row compact"><p>Rebalancear acciones</p><small>Para el viernes</small></article>
            <article className="glass card holding-row compact"><p>Revisar tesis BTC</p><small>Invalidación: 91k</small></article>
            <article className="glass card holding-row compact"><p>Aumentar colchón de liquidez</p><small>Objetivo +5%</small></article>
          </div>
        </section>
      ) : null}

      {screen === "settings" ? (
        <section className="glass card screen-panel">
          <h3>Ajustes</h3>
          <div className="holding-list">
            <article className="glass card holding-row compact"><p>Moneda base</p><small>USD</small></article>
            <article className="glass card holding-row compact"><p>Sincronización de datos</p><small>Modo manual</small></article>
          </div>

          <h3 className="inner-title">Gestión de datos</h3>
          <form className="form-grid" onSubmit={submitHolding}>
            <input value={symbol} onChange={(event) => setSymbol(event.target.value)} placeholder="Símbolo" />
            <input type="number" min="0" step="any" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Cantidad" />
            <input type="number" min="0" step="any" value={avgPrice} onChange={(event) => setAvgPrice(event.target.value)} placeholder="Precio medio" />
            <input type="number" min="0" step="any" value={currentPrice} onChange={(event) => setCurrentPrice(event.target.value)} placeholder="Precio actual" />
            <button type="submit">Guardar holding</button>
          </form>

          <div className="form-grid">
            <select value={csvSource} onChange={(event) => setCsvSource(event.target.value)}>
              <option value="CMC">CSV de CMC</option>
              <option value="XTB">CSV de XTB</option>
            </select>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => importHoldingsCsv(event.target.files?.[0])}
            />
          </div>
          {csvFileName ? <p className="mini-label">Archivo cargado: {csvFileName}</p> : null}
          <p className="mini-label">{message}</p>

          <h3 className="inner-title">Holdings actuales</h3>
          <div className="holding-list">
            {rows.length === 0 ? (
              <article className="glass card holding-row compact"><p>No hay holdings.</p></article>
            ) : (
              rows.map((item) => (
                <article key={item.symbol} className="glass card holding-row compact">
                  <div>
                    <p>{item.symbol}</p>
                    <small>{item.quantity} · {money(item.avgPrice)}</small>
                  </div>
                  <div className="holding-price">
                    <strong>{money(item.marketValue)}</strong>
                    <button type="button" className="danger" onClick={() => removeHolding(item.symbol)}>Eliminar</button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      ) : null}

      <nav className="bottom-nav glass">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`bottom-item ${screen === item.id ? "active" : ""}`}
            type="button"
            onClick={() => setScreen(item.id)}
          >
            <span className="icon-wrap">
              <NavIcon name={item.icon} />
            </span>
            <small>{item.label}</small>
          </button>
        ))}
      </nav>
    </main>
  );
}
