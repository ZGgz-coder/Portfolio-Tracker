import type { Account, Connector, ExpenseCategory, Goal, Holding, Insight, Scenario, Transaction } from "@/types/domain";
import type { AllocationNode, RangeKey, TimePoint } from "@/types/pulse";

export const connectors: Connector[] = [
  { id: "conn-bank-1", name: "Santander", type: "bank", status: "connected", lastSyncAt: "2026-02-18T18:10:00Z" },
  { id: "conn-bank-2", name: "BBVA", type: "bank", status: "connected", lastSyncAt: "2026-02-18T18:12:00Z" },
  { id: "conn-broker-1", name: "Interactive Brokers", type: "broker", status: "connected", lastSyncAt: "2026-02-18T18:14:00Z" },
  { id: "conn-ex-1", name: "Binance", type: "exchange", status: "warning", lastSyncAt: "2026-02-18T17:55:00Z" },
  { id: "conn-wallet-1", name: "Ledger", type: "wallet", status: "connected", lastSyncAt: "2026-02-18T18:04:00Z" },
  { id: "conn-defi-1", name: "Aave", type: "defi", status: "connected", lastSyncAt: "2026-02-18T17:50:00Z" }
];

export const accounts: Account[] = [
  { id: "acc-1", connectorId: "conn-bank-1", name: "Cuenta principal", type: "checking", balance: 18450, currency: "EUR" },
  { id: "acc-2", connectorId: "conn-bank-2", name: "Reserva ahorro", type: "savings", balance: 32200, currency: "EUR" }
];

export const holdings: Holding[] = [
  { id: "h-1", connectorId: "conn-broker-1", symbol: "AAPL", name: "Apple", assetClass: "stock", quantity: 48, price: 196, value: 9408, changePct: 2.2, sparkline: [93, 94, 95, 94.5, 96, 97] },
  { id: "h-2", connectorId: "conn-broker-1", symbol: "MSFT", name: "Microsoft", assetClass: "stock", quantity: 22, price: 422, value: 9284, changePct: 1.4, sparkline: [90, 91.1, 92, 91.6, 92.4, 93.2] },
  { id: "h-3", connectorId: "conn-broker-1", symbol: "NVDA", name: "NVIDIA", assetClass: "stock", quantity: 16, price: 715, value: 11440, changePct: 4.8, sparkline: [80, 82, 83, 84.2, 86, 88] },
  { id: "h-4", connectorId: "conn-broker-1", symbol: "AMZN", name: "Amazon", assetClass: "stock", quantity: 30, price: 174, value: 5220, changePct: 0.8, sparkline: [95, 95.4, 96, 95.8, 96.6, 97] },
  { id: "h-5", connectorId: "conn-broker-1", symbol: "SPY", name: "SPDR S&P 500", assetClass: "stock", quantity: 40, price: 505, value: 20200, changePct: 1.1, sparkline: [100, 100.4, 100.9, 101.1, 101.7, 102.2] },
  { id: "h-6", connectorId: "conn-ex-1", symbol: "BTC", name: "Bitcoin", assetClass: "crypto", quantity: 0.81, price: 65800, value: 53298, changePct: 3.9, network: "BTC", sparkline: [90, 91, 90.5, 92, 93.5, 95] },
  { id: "h-7", connectorId: "conn-ex-1", symbol: "ETH", name: "Ethereum", assetClass: "crypto", quantity: 9.2, price: 3490, value: 32108, changePct: 2.7, network: "ETH", sparkline: [88, 88.6, 89.4, 90, 90.8, 91.4] },
  { id: "h-8", connectorId: "conn-wallet-1", symbol: "SOL", name: "Solana", assetClass: "crypto", quantity: 210, price: 146, value: 30660, changePct: -1.2, network: "SOL", sparkline: [98, 97, 96.8, 97.2, 96.4, 95.6] },
  { id: "h-9", connectorId: "conn-defi-1", symbol: "AAVE", name: "Aave", assetClass: "crypto", quantity: 120, price: 104, value: 12480, changePct: 5.1, network: "ETH", sparkline: [82, 83, 84, 85, 86, 88] }
];

const now = new Date("2026-02-18T19:00:00Z");

export const transactions: Transaction[] = Array.from({ length: 30 }).map((_, idx) => {
  const source = connectors[idx % connectors.length];
  const isIn = idx % 3 !== 0;
  const base = 80 + idx * 23;

  return {
    id: `tx-${idx + 1}`,
    connectorId: source.id,
    sourceType: source.type,
    date: new Date(now.getTime() - idx * 1000 * 60 * 60 * 7).toISOString(),
    label: isIn ? `Ingreso de flujo ${idx + 1}` : `Pago saliente ${idx + 1}`,
    symbol: idx % 4 === 0 ? holdings[idx % holdings.length]?.symbol : undefined,
    hash: idx % 6 === 0 ? `0x${(idx + 1000).toString(16)}abcd` : undefined,
    amount: Number((base * (isIn ? 1 : -1)).toFixed(2)),
    currency: "EUR",
    direction: isIn ? "in" : "out"
  };
});

export const insights: Insight[] = [
  {
    id: "ins-1",
    title: "Buffer de liquidez estable",
    body: "Tu colchón de liquidez cubre 9,4 meses al ritmo actual de salida. Considera rotar 4% de exceso de caja hacia exposición de baja volatilidad.",
    severity: "low",
    createdAt: "2026-02-18T16:30:00Z"
  },
  {
    id: "ins-2",
    title: "Alerta de concentración cripto",
    body: "Cripto alcanzó 42% de la asignación total tras el rally de BTC. Rebalancea recortando 2,5% si tu objetivo de riesgo es 35%.",
    severity: "medium",
    createdAt: "2026-02-18T15:10:00Z"
  },
  {
    id: "ins-3",
    title: "Deriva alpha detectada",
    body: "El diferencial frente al benchmark se estrechó en las últimas 3 sesiones. La contribución de NVDA sigue dominando y aumenta la dependencia de un solo activo.",
    severity: "high",
    createdAt: "2026-02-18T14:00:00Z"
  }
];

export const baselineScenario: Scenario = {
  id: "scenario-baseline",
  name: "Base",
  buySellAmount: 1000,
  allocationShift: 2,
  horizonMonths: 12
};

function seededNoise(seed: number, idx: number) {
  const x = Math.sin(seed * 12.9898 + idx * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function makePremiumSeries(
  seed: number,
  points: number,
  startValue: number,
  trendPct: number,
  noisePct: number,
  shockIndex?: number,
  shockPct?: number,
  startISO = "2026-01-01T00:00:00Z",
  stepMs = 24 * 60 * 60 * 1000
): TimePoint[] {
  const start = new Date(startISO).getTime();
  const out: TimePoint[] = [];
  let current = startValue;

  for (let i = 0; i < points; i += 1) {
    const drift = trendPct / Math.max(points - 1, 1);
    const wave = Math.sin(i * 0.55 + seed) * noisePct * 0.45;
    const random = (seededNoise(seed, i) - 0.5) * noisePct;
    const ret = drift + wave + random;
    current = current * (1 + ret / 100);

    if (shockIndex != null && i === shockIndex && shockPct != null) {
      current = current * (1 + shockPct / 100);
    }

    out.push({
      t: new Date(start + i * stepMs).toISOString(),
      v: Number(current.toFixed(2))
    });
  }

  return out;
}

export const netWorthSeriesByRange: Record<RangeKey, TimePoint[]> = {
  "1D": makePremiumSeries(11, 36, 156000, 0.8, 0.28, 18, -0.6, "2026-02-17T08:00:00Z", 60 * 60 * 1000),
  "1W": makePremiumSeries(22, 14, 154200, 1.9, 0.52, 6, -1.1, "2026-02-11T00:00:00Z", 12 * 60 * 60 * 1000),
  "1M": makePremiumSeries(33, 30, 148500, 4.8, 0.68, 13, -1.9, "2026-01-20T00:00:00Z", 24 * 60 * 60 * 1000),
  "3M": makePremiumSeries(44, 12, 139800, 8.2, 1.1, 5, -2.6, "2025-11-28T00:00:00Z", 7 * 24 * 60 * 60 * 1000),
  "YTD": makePremiumSeries(55, 10, 142000, 7.6, 1.25, 4, -2.4, "2026-01-01T00:00:00Z", 30 * 24 * 60 * 60 * 1000),
  "1Y": makePremiumSeries(66, 12, 121000, 16.4, 1.5, 7, -3.3, "2025-03-01T00:00:00Z", 30 * 24 * 60 * 60 * 1000),
  "ALL": makePremiumSeries(77, 36, 82000, 58, 2.1, 19, -5.8, "2023-03-01T00:00:00Z", 30 * 24 * 60 * 60 * 1000)
};

export const monthlyIncome = 8400;
export const monthlyExpenses = 3240;

export const goals: Goal[] = [
  { id: "goal-1", label: "Fondo de emergencia", target: 30000, current: 22150, emoji: "🛡️" },
  { id: "goal-2", label: "Viaje a Japón", target: 5000, current: 3800, emoji: "✈️" },
  { id: "goal-3", label: "Coche eléctrico", target: 40000, current: 12600, emoji: "🚗" },
  { id: "goal-4", label: "Inversión inmobiliaria", target: 100000, current: 50650, emoji: "🏠" }
];

export const expenseCategories: ExpenseCategory[] = [
  { id: "exp-1", label: "Vivienda", amount: 950, type: "fixed", pct: 29.3 },
  { id: "exp-2", label: "Alimentación", amount: 620, type: "variable", pct: 19.1 },
  { id: "exp-3", label: "Suscripciones", amount: 180, type: "fixed", pct: 5.6 },
  { id: "exp-4", label: "Transporte", amount: 310, type: "fixed", pct: 9.6 },
  { id: "exp-5", label: "Restaurantes", amount: 480, type: "variable", pct: 14.8 },
  { id: "exp-6", label: "Ocio", amount: 390, type: "variable", pct: 12.0 },
  { id: "exp-7", label: "Salud", amount: 310, type: "fixed", pct: 9.6 }
];

export const allocationNodes: AllocationNode[] = [
  {
    id: "cash",
    label: "Cash",
    value: 50650,
    kind: "cash",
    children: [
      { id: "cash-eur", label: "EUR Cash", value: 36800, kind: "cash" },
      { id: "cash-usd", label: "USD Cash", value: 10100, kind: "cash" },
      { id: "cash-stable", label: "Stablecoins", value: 3750, kind: "cash" }
    ]
  },
  {
    id: "stocks",
    label: "Stocks",
    value: 68200,
    kind: "stocks",
    children: [
      { id: "stocks-aapl", label: "AAPL", value: 9408, kind: "stocks" },
      { id: "stocks-msft", label: "MSFT", value: 9284, kind: "stocks" },
      { id: "stocks-nvda", label: "NVDA", value: 11440, kind: "stocks" },
      { id: "stocks-amzn", label: "AMZN", value: 5220, kind: "stocks" },
      { id: "stocks-spy", label: "SPY", value: 20200, kind: "stocks" },
      { id: "stocks-other", label: "Others", value: 12648, kind: "stocks" }
    ]
  },
  {
    id: "crypto",
    label: "Crypto",
    value: 84000,
    kind: "crypto",
    children: [
      { id: "crypto-btc", label: "BTC", value: 53298, kind: "crypto" },
      { id: "crypto-eth", label: "ETH", value: 32108, kind: "crypto" },
      { id: "crypto-sol", label: "SOL", value: 30660, kind: "crypto" },
      { id: "crypto-aave", label: "AAVE", value: 12480, kind: "crypto" }
    ]
  },
];
