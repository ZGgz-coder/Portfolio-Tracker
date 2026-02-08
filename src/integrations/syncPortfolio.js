import { fetchCmcHoldings } from "./cmcAdapter";
import { mergeHoldings, SOURCE_CMC, SOURCE_XTB } from "./portfolioModel";
import { fetchXtbHoldings } from "./xtbAdapter";

const adapters = {
  [SOURCE_CMC]: fetchCmcHoldings,
  [SOURCE_XTB]: fetchXtbHoldings
};

export async function syncConnectedSources(connectedSources) {
  const activeSources = Object.entries(connectedSources)
    .filter(([, connected]) => connected)
    .map(([source]) => source);

  if (activeSources.length === 0) {
    return {
      merged: [],
      raw: [],
      errors: []
    };
  }

  const settled = await Promise.allSettled(
    activeSources.map(async (source) => ({
      source,
      rows: await adapters[source]()
    }))
  );

  const errors = settled.reduce((acc, result, index) => {
    if (result.status === "rejected") {
      acc.push(`${activeSources[index]}: ${result.reason?.message || "Error"}`);
    }
    return acc;
  }, []);

  const raw = settled
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value.rows);

  return {
    raw,
    merged: mergeHoldings(raw),
    errors
  };
}
