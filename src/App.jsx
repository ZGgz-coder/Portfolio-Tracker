const holdings = [
  { symbol: "AAPL", quantity: 12, avgPrice: 172.4, currentPrice: 189.1 },
  { symbol: "MSFT", quantity: 8, avgPrice: 310.2, currentPrice: 423.7 },
  { symbol: "TSLA", quantity: 5, avgPrice: 245.8, currentPrice: 212.4 }
];

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

export default function App() {
  const rows = holdings.map((item) => {
    const invested = item.quantity * item.avgPrice;
    const marketValue = item.quantity * item.currentPrice;
    const pnl = marketValue - invested;

    return {
      ...item,
      invested,
      marketValue,
      pnl
    };
  });

  const totalInvested = rows.reduce((sum, item) => sum + item.invested, 0);
  const totalValue = rows.reduce((sum, item) => sum + item.marketValue, 0);
  const totalPnL = totalValue - totalInvested;

  return (
    <main className="app-shell">
      <header>
        <p className="eyebrow">Starter App</p>
        <h1>Portfolio Tracker</h1>
        <p className="subtitle">
          Base lista para conectar precios reales y CRUD de activos.
        </p>
      </header>

      <section className="kpis">
        <article>
          <span>Invertido</span>
          <strong>{money(totalInvested)}</strong>
        </article>
        <article>
          <span>Valor actual</span>
          <strong>{money(totalValue)}</strong>
        </article>
        <article>
          <span>Ganancia/Pérdida</span>
          <strong className={totalPnL >= 0 ? "up" : "down"}>{money(totalPnL)}</strong>
        </article>
      </section>

      <section className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Cantidad</th>
              <th>Promedio</th>
              <th>Precio actual</th>
              <th>PnL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.symbol}>
                <td>{item.symbol}</td>
                <td>{item.quantity}</td>
                <td>{money(item.avgPrice)}</td>
                <td>{money(item.currentPrice)}</td>
                <td className={item.pnl >= 0 ? "up" : "down"}>{money(item.pnl)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
