import { normalizeHolding, SOURCE_CMC } from "./portfolioModel";

function readArray(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.holdings)) {
    return payload.holdings;
  }

  if (Array.isArray(payload?.data?.holdings)) {
    return payload.data.holdings;
  }

  return [];
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toHolding(item) {
  return normalizeHolding({
    symbol: item.symbol || item.ticker || item.assetSymbol || item.coin,
    quantity: toNumber(item.quantity ?? item.amount ?? item.volume ?? item.qty ?? item.balance),
    avgPrice: toNumber(item.avgPrice ?? item.averagePrice ?? item.avgBuyUsd ?? item.costBasis),
    currentPrice: toNumber(item.currentPrice ?? item.markUsd ?? item.price ?? item.last),
    source: SOURCE_CMC
  });
}

export async function fetchCmcHoldings() {
  const apiUrl = import.meta.env.VITE_CMC_API_URL;
  const apiKey = import.meta.env.VITE_CMC_API_KEY;
  const apiKeyHeader = import.meta.env.VITE_CMC_API_KEY_HEADER || "X-API-KEY";

  if (!apiUrl) {
    throw new Error("Falta VITE_CMC_API_URL");
  }

  const headers = {
    "Content-Type": "application/json"
  };

  if (apiKey) {
    headers[apiKeyHeader] = apiKey;
  }

  const response = await fetch(apiUrl, { headers });

  if (!response.ok) {
    throw new Error(`CMC devolvio ${response.status}`);
  }

  const payload = await response.json();
  const rows = readArray(payload);
  const normalized = rows
    .map((item) => toHolding(item))
    .filter((item) => item.symbol && item.quantity > 0);

  return normalized;
}
