import cors from "cors";
import express from "express";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "127.0.0.1";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const holdingsPath = path.resolve(__dirname, "../data/holdings.json");

app.use(cors());
app.use(express.json());

function normalizeHolding(item) {
  return {
    symbol: String(item?.symbol || "").toUpperCase(),
    quantity: Number(item?.quantity || 0),
    avgPrice: Number(item?.avgPrice || 0)
  };
}

function isValidHolding(item) {
  return (
    typeof item.symbol === "string" &&
    item.symbol.length > 0 &&
    Number.isFinite(item.quantity) &&
    item.quantity > 0 &&
    Number.isFinite(item.avgPrice) &&
    item.avgPrice >= 0
  );
}

async function readHoldings() {
  const content = await readFile(holdingsPath, "utf8");
  const parsed = JSON.parse(content);
  const list = Array.isArray(parsed) ? parsed : [];
  return list.map(normalizeHolding).filter(isValidHolding);
}

async function saveHoldings(nextHoldings) {
  await mkdir(path.dirname(holdingsPath), { recursive: true });
  await writeFile(holdingsPath, `${JSON.stringify(nextHoldings, null, 2)}\n`, "utf8");
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/holdings", async (_req, res) => {
  try {
    const data = await readHoldings();
    res.json({ data });
  } catch {
    res.status(500).json({ error: "No se pudieron leer los holdings" });
  }
});

app.put("/api/holdings", async (req, res) => {
  const incoming = Array.isArray(req.body) ? req.body : req.body?.data;

  if (!Array.isArray(incoming)) {
    res.status(400).json({ error: "Body invalido. Usa [] o { data: [] }" });
    return;
  }

  const normalized = incoming.map(normalizeHolding).filter(isValidHolding);

  try {
    await saveHoldings(normalized);
    res.json({ data: normalized, updated: true });
  } catch {
    res.status(500).json({ error: "No se pudieron guardar los holdings" });
  }
});

app.post("/api/holdings", async (req, res) => {
  const next = normalizeHolding(req.body);

  if (!isValidHolding(next)) {
    res.status(400).json({ error: "Holding invalido" });
    return;
  }

  try {
    const current = await readHoldings();
    const merged = [...current.filter((item) => item.symbol !== next.symbol), next];
    await saveHoldings(merged);
    res.status(201).json({ data: merged, created: true });
  } catch {
    res.status(500).json({ error: "No se pudo agregar el holding" });
  }
});

app.listen(port, host, () => {
  console.log(`Portfolio API listening on http://${host}:${port}`);
});
