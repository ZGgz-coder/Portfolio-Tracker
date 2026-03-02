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
const expensesPath = path.resolve(__dirname, "../data/expenses.json");

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

function normalizeExpense(item) {
  return {
    id: String(item?.id || ""),
    concepto: String(item?.concepto || "").trim(),
    monto: Number(item?.monto || 0),
    categoria: String(item?.categoria || "Otros"),
    recurrencia: String(item?.recurrencia || "Mensual"),
    dia: Number(item?.dia || 1),
    inicio: String(item?.inicio || ""),
    metodo: String(item?.metodo || "")
  };
}

function isValidExpense(item) {
  return (
    typeof item.id === "string" &&
    item.id.length > 0 &&
    typeof item.concepto === "string" &&
    item.concepto.length > 0 &&
    Number.isFinite(item.monto) &&
    item.monto > 0 &&
    Number.isFinite(item.dia) &&
    item.dia >= 1 &&
    item.dia <= 31
  );
}

async function readExpenses() {
  try {
    const content = await readFile(expensesPath, "utf8");
    const parsed = JSON.parse(content);
    const list = Array.isArray(parsed) ? parsed : [];
    return list.map(normalizeExpense).filter(isValidExpense);
  } catch {
    return [];
  }
}

async function saveExpenses(nextExpenses) {
  await mkdir(path.dirname(expensesPath), { recursive: true });
  await writeFile(expensesPath, `${JSON.stringify(nextExpenses, null, 2)}\n`, "utf8");
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

app.get("/api/expenses", async (_req, res) => {
  try {
    const data = await readExpenses();
    res.json({ data });
  } catch {
    res.status(500).json({ error: "No se pudieron leer los gastos" });
  }
});

app.post("/api/expenses", async (req, res) => {
  const next = normalizeExpense(req.body);

  if (!isValidExpense(next)) {
    res.status(400).json({ error: "Gasto invalido" });
    return;
  }

  try {
    const current = await readExpenses();
    const merged = [...current.filter((item) => item.id !== next.id), next];
    await saveExpenses(merged);
    res.status(201).json({ data: merged, created: true });
  } catch {
    res.status(500).json({ error: "No se pudo agregar el gasto" });
  }
});

app.delete("/api/expenses/:id", async (req, res) => {
  try {
    const current = await readExpenses();
    const next = current.filter((item) => item.id !== req.params.id);
    await saveExpenses(next);
    res.json({ data: next, removed: true });
  } catch {
    res.status(500).json({ error: "No se pudo eliminar el gasto" });
  }
});

app.listen(port, host, () => {
  console.log(`Portfolio API listening on http://${host}:${port}`);
});
