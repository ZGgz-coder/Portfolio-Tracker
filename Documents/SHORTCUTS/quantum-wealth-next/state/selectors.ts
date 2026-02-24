import type { Holding, Insight, Scenario, Transaction } from "@/types/domain";
import { accounts as mockAccounts, monthlyExpenses as mockMonthlyExpenses } from "@/state/mockData";
import type { AllocationNode, RangeKey, TimePoint } from "@/types/pulse";
import { allocationNodes, insights, netWorthSeriesByRange } from "@/state/mockData";

export function getNetWorth(holdings: Holding[], cash: number) {
  return holdings.reduce((sum, item) => sum + item.value, cash);
}

export function sortAlphaHoldings(holdings: Holding[], sort: "value" | "change" | "name") {
  const copy = holdings.filter((holding) => holding.assetClass === "stock");
  if (sort === "name") return copy.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "change") return copy.sort((a, b) => b.changePct - a.changePct);
  return copy.sort((a, b) => b.value - a.value);
}

export function filterFrontierHoldings(holdings: Holding[], tab: "exchanges" | "wallets" | "defi") {
  const set =
    tab === "exchanges"
      ? new Set(["exchange"])
      : tab === "wallets"
        ? new Set(["wallet"])
        : new Set(["defi"]);

  return holdings.filter((holding) => set.has(mapConnectorType(holding.connectorId)));
}

export function filterTransactions(
  transactions: Transaction[],
  source: "all" | "bank" | "broker" | "exchange" | "wallet" | "defi",
  query: string
) {
  const q = query.trim().toLowerCase();
  return transactions.filter((tx) => {
    const sourceMatch = source === "all" ? true : tx.sourceType === source;
    const text = `${tx.label} ${tx.symbol ?? ""} ${tx.hash ?? ""}`.toLowerCase();
    const queryMatch = !q || text.includes(q);
    return sourceMatch && queryMatch;
  });
}

export function scenarioSeries(base: number[], scenario: Scenario) {
  const shift = 1 + scenario.allocationShift / 100;
  const amountFactor = 1 + scenario.buySellAmount / 100000;
  const horizonFactor = 1 + scenario.horizonMonths / 240;
  return base.map((point, idx) => point * shift * amountFactor * (1 + (idx / (base.length - 1 || 1)) * (horizonFactor - 1)));
}

export function selectPulseSeries(range: RangeKey): TimePoint[] {
  return netWorthSeriesByRange[range] || netWorthSeriesByRange["1W"];
}

export function selectPulseLatest(series: TimePoint[]) {
  if (!series.length) {
    return { value: 0, deltaAbs: 0, deltaPct: 0 };
  }
  const first = series[0].v;
  const last = series[series.length - 1].v;
  const deltaAbs = last - first;
  const deltaPct = first > 0 ? (deltaAbs / first) * 100 : 0;
  return {
    value: last,
    deltaAbs,
    deltaPct
  };
}

export function selectPulseVolatility(series: TimePoint[]) {
  if (series.length < 2) return 0;
  const returns: number[] = [];
  for (let i = 1; i < series.length; i += 1) {
    const prev = series[i - 1].v;
    const curr = series[i].v;
    returns.push(prev > 0 ? ((curr - prev) / prev) * 100 : 0);
  }
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance);
}

export function selectPulseDrawdown(series: TimePoint[]) {
  if (!series.length) return 0;
  let peak = series[0].v;
  let maxDD = 0;

  for (const point of series) {
    if (point.v > peak) peak = point.v;
    const dd = peak > 0 ? ((peak - point.v) / peak) * 100 : 0;
    if (dd > maxDD) maxDD = dd;
  }

  return maxDD;
}

export function selectPulseCopilotState(
  latest: { value: number; deltaAbs: number; deltaPct: number },
  vol: number,
  dd: number
): "bull" | "correction" | "volatile" {
  if (dd >= 4 || latest.deltaPct < -1) return "correction";
  if (vol >= 0.95) return "volatile";
  return "bull";
}

export function selectAllocationTreemap(): AllocationNode[] {
  return allocationNodes;
}

export function selectAllocationSankey(tree: AllocationNode[] = allocationNodes): {
  nodes: { name: string }[];
  links: { source: number; target: number; value: number }[];
} {
  const nodes: { name: string }[] = [{ name: "Net Worth" }];
  const links: { source: number; target: number; value: number }[] = [];
  const indexById = new Map<string, number>([["root", 0]]);

  const ensureNode = (id: string, name: string) => {
    const existing = indexById.get(id);
    if (existing != null) return existing;
    const nextIndex = nodes.length;
    nodes.push({ name });
    indexById.set(id, nextIndex);
    return nextIndex;
  };

  const rootIdx = 0;

  for (const bucket of tree) {
    const parentValue = Math.max(bucket.value, 0);
    if (parentValue <= 0) continue;

    const bucketIdx = ensureNode(bucket.id, bucket.label);
    links.push({ source: rootIdx, target: bucketIdx, value: Number(parentValue.toFixed(2)) });

    const children = (bucket.children ?? []).filter((child) => child.value > 0);
    if (!children.length) continue;

    const childSum = children.reduce((sum, child) => sum + child.value, 0);
    if (childSum <= 0) continue;

    if (childSum <= parentValue) {
      for (const child of children) {
        const childIdx = ensureNode(child.id, child.label);
        links.push({ source: bucketIdx, target: childIdx, value: Number(child.value.toFixed(2)) });
      }
      const remainder = Number((parentValue - childSum).toFixed(2));
      if (remainder > 0) {
        const otherId = `${bucket.id}-other-balance`;
        const otherIdx = ensureNode(otherId, `${bucket.label} Other`);
        links.push({ source: bucketIdx, target: otherIdx, value: remainder });
      }
      continue;
    }

    let running = 0;
    children.forEach((child, idx) => {
      const childIdx = ensureNode(child.id, child.label);
      if (idx === children.length - 1) {
        const lastValue = Number((parentValue - running).toFixed(2));
        if (lastValue > 0) links.push({ source: bucketIdx, target: childIdx, value: lastValue });
        return;
      }
      const scaled = Number(((child.value / childSum) * parentValue).toFixed(2));
      running += scaled;
      if (scaled > 0) links.push({ source: bucketIdx, target: childIdx, value: scaled });
    });
  }

  return { nodes, links };
}

export function selectCopilotInsight(pool: Insight[] = insights): Insight {
  const severityScore = { low: 1, medium: 2, high: 3 } as const;
  return [...pool].sort((a, b) => {
    const bySeverity = severityScore[b.severity] - severityScore[a.severity];
    if (bySeverity !== 0) return bySeverity;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  })[0];
}

export function selectFlowHero(monthlyIncome: number, monthlyExpenses: number) {
  const saved = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? (saved / monthlyIncome) * 100 : 0;
  // Simulate prev month with slight variation
  const prevIncome = monthlyIncome * 0.94;
  const prevExpenses = monthlyExpenses * 1.05;
  return {
    income: monthlyIncome,
    expenses: monthlyExpenses,
    saved,
    savingsRate,
    deltaIncomePct: ((monthlyIncome - prevIncome) / prevIncome) * 100,
    deltaExpensesPct: ((monthlyExpenses - prevExpenses) / prevExpenses) * 100
  };
}

export function selectRunway(totalCash: number, monthlyExp: number = mockMonthlyExpenses) {
  if (monthlyExp <= 0) return { months: 99, status: "safe" as const };
  const months = totalCash / monthlyExp;
  const status = months >= 6 ? "safe" : months >= 3 ? "warning" : "danger";
  return { months: Number(months.toFixed(1)), status: status as "safe" | "warning" | "danger" };
}

export function selectHeatMap(holdings: Holding[]) {
  const total = holdings.reduce((sum, h) => sum + h.value, 0) || 1;
  const maxChange = Math.max(...holdings.map((h) => Math.abs(h.changePct)), 1);
  return holdings
    .sort((a, b) => b.value - a.value)
    .map((h) => ({
      ...h,
      sizeWeight: (h.value / total) * 100,
      colorScore: h.changePct / maxChange // -1 to +1
    }));
}

export function selectTopMovers(holdings: Holding[]) {
  const sorted = [...holdings].sort((a, b) => b.changePct - a.changePct);
  return {
    winners: sorted.slice(0, 3),
    losers: sorted.slice(-3).reverse()
  };
}

function mapConnectorType(connectorId: string) {
  if (connectorId.includes("ex")) return "exchange";
  if (connectorId.includes("wallet")) return "wallet";
  if (connectorId.includes("defi")) return "defi";
  if (connectorId.includes("broker")) return "broker";
  return "bank";
}
