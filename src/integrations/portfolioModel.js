export const SOURCE_CMC = "cmc";
export const SOURCE_XTB = "xtb";

export const SOURCES = [SOURCE_CMC, SOURCE_XTB];

export function normalizeHolding({
  symbol,
  quantity,
  avgPrice,
  currentPrice,
  source
}) {
  return {
    symbol: String(symbol || "").toUpperCase(),
    quantity: Number(quantity || 0),
    avgPrice: Number(avgPrice || 0),
    currentPrice: Number(currentPrice || 0),
    source
  };
}

export function mergeHoldings(holdings) {
  const bucket = new Map();

  holdings.forEach((item) => {
    const existing = bucket.get(item.symbol);

    if (!existing) {
      bucket.set(item.symbol, {
        symbol: item.symbol,
        quantity: item.quantity,
        weightedCost: item.quantity * item.avgPrice,
        weightedMarket: item.quantity * item.currentPrice,
        sources: [item.source]
      });
      return;
    }

    existing.quantity += item.quantity;
    existing.weightedCost += item.quantity * item.avgPrice;
    existing.weightedMarket += item.quantity * item.currentPrice;
    if (!existing.sources.includes(item.source)) {
      existing.sources.push(item.source);
    }
  });

  return Array.from(bucket.values()).map((item) => ({
    symbol: item.symbol,
    quantity: item.quantity,
    avgPrice: item.quantity ? item.weightedCost / item.quantity : 0,
    currentPrice: item.quantity ? item.weightedMarket / item.quantity : 0,
    sources: item.sources
  }));
}
