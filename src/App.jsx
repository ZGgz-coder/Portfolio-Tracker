import { useMemo, useState } from "react";

const STORAGE_KEY = "quantum-wealth-holdings-v2";

const NAV_ITEMS = [
  { id: "control", label: "Home", icon: "◉" },
  { id: "wealth", label: "Wealth", icon: "◌" },
  { id: "markets", label: "Markets", icon: "◎" },
  { id: "strategy", label: "Plan", icon: "◍" },
  { id: "settings", label: "Settings", icon: "◐" }
];

const marketWatch = [
  { ticker: "BTC", name: "Bitcoin", value: 64210, change: 2.4 },
  { ticker: "AAPL", name: "Apple Inc.", value: 189.42, change: -0.8 },
  { ticker: "ETH", name: "Ethereum", value: 3452.12, change: 5.1 }
];

const insights = [
  { id: "i1", kind: "Top Performer", title: "Bitcoin (BTC)", note: "Exceeding 7-day volatility by 12.4%.", tone: "primary" },
  { id: "i2", kind: "Action Needed", title: "Rebalance Stocks", note: "AAPL now represents 22% of stock portfolio.", tone: "purple" }
];

const bankAccounts = [
  { id: "b1", name: "Santander Everyday", type: "Checking", balance: 28450 },
  { id: "b2", name: "BBVA Reserve", type: "Savings", balance: 61500 },
  { id: "b3", name: "Revolut Cash", type: "Cash", balance: 12240 }
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

export default function App() {
  const [screen, setScreen] = useState("control");
  const [holdings, setHoldings] = useState(() => loadHoldings());
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [message, setMessage] = useState("Track and refine your positions.");

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
  const netWorth = bankTotal + cryptoTotal;
  const todayDelta = rows.reduce((sum, item) => sum + item.pnl / 10, 0) + bankTotal * 0.003;

  const submitHolding = (event) => {
    event.preventDefault();

    const cleanSymbol = symbol.trim().toUpperCase();
    const qty = Number(quantity);
    const avg = Number(avgPrice);
    const current = Number(currentPrice);

    if (!cleanSymbol || qty <= 0 || avg <= 0 || current <= 0) {
      setMessage("Complete all fields with valid values.");
      return;
    }

    const next = [
      ...holdings.filter((item) => item.symbol !== cleanSymbol),
      { symbol: cleanSymbol, quantity: qty, avgPrice: avg, currentPrice: current }
    ].sort((a, b) => a.symbol.localeCompare(b.symbol));

    setHoldings(next);
    saveHoldings(next);
    setMessage(`Saved ${cleanSymbol}`);
    setSymbol("");
    setQuantity("");
    setAvgPrice("");
    setCurrentPrice("");
  };

  const removeHolding = (targetSymbol) => {
    const next = holdings.filter((item) => item.symbol !== targetSymbol);
    setHoldings(next);
    saveHoldings(next);
    setMessage(`Removed ${targetSymbol}`);
  };

  return (
    <main className="app-shell">
      <div className="aurora-bg" />

      <header className="topbar glass">
        <div className="profile-block">
          <div className="avatar">QW</div>
          <div>
            <p className="mini-label">Good Morning</p>
            <h2>Welcome back</h2>
          </div>
        </div>
        <button className="icon-btn" type="button">◎</button>
      </header>

      {screen === "control" ? (
        <>
          <section className="net-worth">
            <p className="section-label">Total Net Worth</p>
            <h1>
              {money(netWorth).split(".")[0]}
              <span>.{money(netWorth).split(".")[1] || "00"}</span>
            </h1>
            <div className="delta-pill up">{money(todayDelta)} ({pct((todayDelta / (netWorth || 1)) * 100)}) today</div>
          </section>

          <section className="glass card chart-card">
            <div className="chart-head">
              <div>
                <p className="mini-label">Portfolio Growth</p>
                <h3>12-Month View</h3>
              </div>
              <div className="range-pills">
                <span>1D</span>
                <span className="active">1M</span>
                <span>1Y</span>
              </div>
            </div>
            <div className="chart-placeholder" />
          </section>

          <section className="mix-section">
            <h3 className="section-subtitle">Allocation Breakdown</h3>
            <div className="mix-scroll">
              <article className="glass card mix-item">
                <p>Crypto</p>
                <strong>{cryptoTotal > 0 ? `${((cryptoTotal / netWorth) * 100).toFixed(0)}%` : "0%"}</strong>
                <small>{money(cryptoTotal)}</small>
              </article>
              <article className="glass card mix-item">
                <p>Bank</p>
                <strong>{((bankTotal / netWorth) * 100).toFixed(0)}%</strong>
                <small>{money(bankTotal)}</small>
              </article>
              <article className="glass card mix-item">
                <p>Cash Buffer</p>
                <strong>8%</strong>
                <small>{money(netWorth * 0.08)}</small>
              </article>
            </div>
          </section>

          <section className="insights-section">
            <h3 className="section-subtitle">Smart Insights</h3>
            <div className="insight-grid">
              {insights.map((item) => (
                <article key={item.id} className={`glass card insight ${item.tone}`}>
                  <p className="insight-kind">{item.kind}</p>
                  <h4>{item.title}</h4>
                  <small>{item.note}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="holdings-section">
            <div className="holdings-head">
              <h3 className="section-subtitle">Main Holdings</h3>
              <button className="text-btn" type="button" onClick={() => setScreen("wealth")}>View All</button>
            </div>
            <div className="holding-list">
              {marketWatch.map((item) => (
                <article key={item.ticker} className="glass card holding-row">
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
        </>
      ) : null}

      {screen === "wealth" ? (
        <section className="glass card screen-panel">
          <h3>Wealth Accounts</h3>
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

          <h3 className="inner-title">Crypto Editor</h3>
          <form className="form-grid" onSubmit={submitHolding}>
            <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="Symbol" />
            <input type="number" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantity" />
            <input type="number" min="0" step="any" value={avgPrice} onChange={(e) => setAvgPrice(e.target.value)} placeholder="Avg price" />
            <input type="number" min="0" step="any" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} placeholder="Current" />
            <button type="submit">Save Holding</button>
          </form>
          <p className="mini-label">{message}</p>

          <div className="holding-list">
            {rows.map((item) => (
              <article key={item.symbol} className="glass card holding-row compact">
                <div>
                  <p>{item.symbol}</p>
                  <small>{item.quantity}</small>
                </div>
                <div className="holding-price">
                  <strong>{money(item.marketValue)}</strong>
                  <button type="button" className="danger" onClick={() => removeHolding(item.symbol)}>Remove</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {screen === "markets" ? (
        <section className="glass card screen-panel">
          <h3>Markets</h3>
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
          <h3>Strategy</h3>
          <div className="holding-list">
            <article className="glass card holding-row compact"><p>Rebalance Stocks</p><small>Due Friday</small></article>
            <article className="glass card holding-row compact"><p>Review BTC thesis</p><small>Invalidation: 91k</small></article>
            <article className="glass card holding-row compact"><p>Increase cash buffer</p><small>Target +5%</small></article>
          </div>
        </section>
      ) : null}

      {screen === "settings" ? (
        <section className="glass card screen-panel">
          <h3>Settings</h3>
          <div className="holding-list">
            <article className="glass card holding-row compact"><p>Base Currency</p><small>USD</small></article>
            <article className="glass card holding-row compact"><p>Data Sync</p><small>Manual mode</small></article>
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
            <span>{item.icon}</span>
            <small>{item.label}</small>
          </button>
        ))}
      </nav>
    </main>
  );
}
