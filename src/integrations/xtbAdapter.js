import { normalizeHolding, SOURCE_XTB } from "./portfolioModel";

const XTB_MOCK_RESPONSE = [
  { instrument: "AAPL", volume: 12, avgOpen: 172.4, last: 189.1 },
  { instrument: "TSLA", volume: 5, avgOpen: 245.8, last: 212.4 }
];

export async function fetchXtbHoldings() {
  await new Promise((resolve) => setTimeout(resolve, 550));

  return XTB_MOCK_RESPONSE.map((item) =>
    normalizeHolding({
      symbol: item.instrument,
      quantity: item.volume,
      avgPrice: item.avgOpen,
      currentPrice: item.last,
      source: SOURCE_XTB
    })
  );
}

