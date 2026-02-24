export type ConnectorType = "bank" | "broker" | "exchange" | "wallet" | "defi";

export type UIState = "loading" | "empty" | "error" | "data";

export interface Connector {
  id: string;
  name: string;
  type: ConnectorType;
  status: "connected" | "warning";
  lastSyncAt: string;
}

export interface Account {
  id: string;
  connectorId: string;
  name: string;
  type: "checking" | "savings" | "card";
  balance: number;
  currency: string;
}

export interface Holding {
  id: string;
  connectorId: string;
  symbol: string;
  name: string;
  assetClass: "stock" | "crypto";
  quantity: number;
  price: number;
  value: number;
  changePct: number;
  network?: "ETH" | "SOL" | "BTC";
  sparkline: number[];
}

export interface Transaction {
  id: string;
  connectorId: string;
  sourceType: ConnectorType;
  date: string;
  label: string;
  symbol?: string;
  hash?: string;
  amount: number;
  currency: string;
  direction: "in" | "out";
}

export interface Insight {
  id: string;
  title: string;
  body: string;
  severity: "low" | "medium" | "high";
  createdAt: string;
}

export interface Scenario {
  id: string;
  name: string;
  buySellAmount: number;
  allocationShift: number;
  horizonMonths: number;
}

export interface Goal {
  id: string;
  label: string;
  target: number;
  current: number;
  emoji: string;
}

export interface ExpenseCategory {
  id: string;
  label: string;
  amount: number;
  type: "fixed" | "variable";
  pct: number;
}
