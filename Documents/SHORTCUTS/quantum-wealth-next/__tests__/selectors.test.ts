import { describe, expect, it } from "vitest";
import { holdings, transactions } from "@/state/mockData";
import {
  filterTransactions,
  scenarioSeries,
  selectAllocationSankey,
  selectPulseCopilotState,
  selectPulseLatest,
  selectPulseSeries,
  sortAlphaHoldings
} from "@/state/selectors";

describe("selectors", () => {
  it("sorts alpha holdings by value", () => {
    const sorted = sortAlphaHoldings(holdings, "value");
    expect(sorted[0].value).toBeGreaterThanOrEqual(sorted[1].value);
  });

  it("filters transactions by source and query", () => {
    const filtered = filterTransactions(transactions, "exchange", "ingreso");
    expect(filtered.every((tx) => tx.sourceType === "exchange")).toBe(true);
  });

  it("produces non-flat scenario series", () => {
    const baseline = [100, 101, 102, 103, 104];
    const series = scenarioSeries(baseline, {
      id: "s1",
      name: "S1",
      buySellAmount: 10000,
      allocationShift: 5,
      horizonMonths: 18
    });

    expect(series.length).toBe(baseline.length);
    expect(series[series.length - 1]).not.toBe(series[0]);
  });

  it("returns correct pulse range lengths and non-flat values", () => {
    expect(selectPulseSeries("1D")).toHaveLength(36);
    expect(selectPulseSeries("1W")).toHaveLength(14);
    expect(selectPulseSeries("1M")).toHaveLength(30);
    expect(selectPulseSeries("3M")).toHaveLength(12);
    expect(selectPulseSeries("YTD")).toHaveLength(10);
    expect(selectPulseSeries("1Y")).toHaveLength(12);
    expect(selectPulseSeries("ALL")).toHaveLength(36);

    const all = selectPulseSeries("ALL");
    const unique = new Set(all.map((point) => point.v));
    expect(unique.size).toBeGreaterThan(10);
  });

  it("computes pulse latest delta correctly", () => {
    const sample = [
      { t: "2026-01-01T00:00:00Z", v: 1000 },
      { t: "2026-01-02T00:00:00Z", v: 1120 }
    ];

    const latest = selectPulseLatest(sample);
    expect(latest.value).toBe(1120);
    expect(latest.deltaAbs).toBe(120);
    expect(latest.deltaPct).toBeCloseTo(12, 4);
  });

  it("returns bull state", () => {
    expect(selectPulseCopilotState({ value: 1100, deltaAbs: 50, deltaPct: 4.5 }, 0.4, 1.2)).toBe("bull");
  });

  it("returns correction state", () => {
    expect(selectPulseCopilotState({ value: 900, deltaAbs: -80, deltaPct: -3.8 }, 0.6, 5.2)).toBe("correction");
  });

  it("returns volatile state", () => {
    expect(selectPulseCopilotState({ value: 1030, deltaAbs: 10, deltaPct: 0.9 }, 1.3, 1.1)).toBe("volatile");
  });

  it("builds sankey nodes and balanced first-level links", () => {
    const sankey = selectAllocationSankey();
    expect(sankey.nodes.length).toBeGreaterThan(5);
    expect(sankey.links.length).toBeGreaterThan(5);

    const rootIndex = sankey.nodes.findIndex((node) => node.name === "Net Worth");
    expect(rootIndex).toBe(0);

    const outgoingRoot = sankey.links
      .filter((link) => link.source === rootIndex)
      .reduce((sum, link) => sum + link.value, 0);

    const incomingClassSum = sankey.links
      .filter((link) => link.source === rootIndex)
      .reduce((sum, link) => {
        const out = sankey.links.filter((child) => child.source === link.target).reduce((acc, child) => acc + child.value, 0);
        return sum + (out > 0 ? out : link.value);
      }, 0);

    expect(Math.abs(incomingClassSum - outgoingRoot)).toBeLessThan(0.1);
  });
});
