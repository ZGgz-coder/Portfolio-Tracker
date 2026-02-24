"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import QuantumCard from "@/components/ui/QuantumCard";
import PrivacyNumber from "@/components/ui/PrivacyNumber";
import SourceBadge from "@/components/ui/SourceBadge";
import StateGate from "@/components/ui/StateGate";
import { fadeUp } from "@/lib/motion";
import { selectFlowHero, selectRunway } from "@/state/selectors";
import { useQuantumStore } from "@/state/store";
import { tokens } from "@/styles/tokens";

const weekData = [
  { label: "Lun", inc: 420, exp: 180 },
  { label: "Mar", inc: 1800, exp: 240 },
  { label: "Mié", inc: 0, exp: 390 },
  { label: "Jue", inc: 280, exp: 270 },
  { label: "Vie", inc: 6100, exp: 510 },
  { label: "Sáb", inc: 0, exp: 320 },
  { label: "Dom", inc: 0, exp: 130 }
];

export default function FlowPage() {
  const screenState = useQuantumStore((s) => s.screenState);
  const accounts = useQuantumStore((s) => s.accounts);
  const transactions = useQuantumStore((s) => s.transactions);
  const expenseCategories = useQuantumStore((s) => s.expenseCategories);
  const monthlyIncome = useQuantumStore((s) => s.monthlyIncome);
  const monthlyExpenses = useQuantumStore((s) => s.monthlyExpenses);
  const [activeCategory, setActiveCategory] = useState<"all" | "fixed" | "variable">("all");

  const flow = useMemo(() => selectFlowHero(monthlyIncome, monthlyExpenses), [monthlyIncome, monthlyExpenses]);
  const totalCash = useMemo(() => accounts.reduce((sum, a) => sum + a.balance, 0), [accounts]);
  const runway = useMemo(() => selectRunway(totalCash, monthlyExpenses), [totalCash, monthlyExpenses]);

  const filteredCategories = useMemo(
    () => activeCategory === "all" ? expenseCategories : expenseCategories.filter((c) => c.type === activeCategory),
    [expenseCategories, activeCategory]
  );

  const recent = useMemo(() => transactions.slice(0, 6), [transactions]);

  const runwayColor =
    runway.status === "safe" ? tokens.tealGlow :
    runway.status === "warning" ? tokens.amber :
    tokens.coral;

  const maxBar = Math.max(...weekData.map((d) => d.inc + d.exp), 1);

  return (
    <StateGate state={screenState}>
      <section className="qw-screen">

        {/* Hero bipolar */}
        <motion.div {...fadeUp}>
          <QuantumCard disableGlow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: "1.1rem" }}>↑</span>
                  <span className="qw-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Ingresos</span>
                </div>
                <PrivacyNumber value={flow.income} format="currency" size="lg" />
                <div style={{ marginTop: 2, fontSize: "0.72rem", color: flow.deltaIncomePct >= 0 ? tokens.tealGlow : tokens.coral }}>
                  {flow.deltaIncomePct >= 0 ? "+" : ""}{flow.deltaIncomePct.toFixed(1)}% vs mes anterior
                </div>
              </div>
              <div style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", paddingLeft: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: "1.1rem" }}>↓</span>
                  <span className="qw-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Gastos</span>
                </div>
                <PrivacyNumber value={flow.expenses} format="currency" size="lg" />
                <div style={{ marginTop: 2, fontSize: "0.72rem", color: flow.deltaExpensesPct <= 0 ? tokens.tealGlow : tokens.amber }}>
                  {flow.deltaExpensesPct >= 0 ? "+" : ""}{flow.deltaExpensesPct.toFixed(1)}% vs mes anterior
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: "8px 10px", borderRadius: 12, background: "rgba(201,162,39,0.06)", border: "1px solid rgba(201,162,39,0.18)" }}>
              <div className="qw-row">
                <span className="qw-muted" style={{ fontSize: "0.72rem" }}>Ahorro mensual</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <PrivacyNumber value={flow.saved} format="currency" size="sm" />
                  <span style={{ fontSize: "0.72rem", color: tokens.gold }}>{flow.savingsRate.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </QuantumCard>
        </motion.div>

        {/* Runway de liquidez */}
        <motion.div {...fadeUp}>
          <QuantumCard title="Runway de Liquidez">
            <div className="qw-row" style={{ marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: "2rem", fontWeight: 800, color: runwayColor }}>{runway.months}</span>
                <span className="qw-muted" style={{ fontSize: "0.88rem", marginLeft: 6 }}>meses</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.72rem", color: runwayColor, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {runway.status === "safe" ? "Saludable" : runway.status === "warning" ? "Atención" : "Crítico"}
                </div>
                <div className="qw-muted" style={{ fontSize: "0.68rem" }}>Tu liquidez actual</div>
              </div>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((runway.months / 12) * 100, 100)}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                style={{ height: "100%", borderRadius: 999, background: runwayColor, boxShadow: `0 0 12px ${runwayColor}` }}
              />
            </div>
            <div style={{ marginTop: 6, fontSize: "0.72rem" }} className="qw-muted">
              Basado en {flow.expenses.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })} de gastos mensuales
            </div>
          </QuantumCard>
        </motion.div>

        {/* Flujo semanal */}
        <motion.div {...fadeUp}>
          <QuantumCard title="Actividad semanal">
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 80 }}>
              {weekData.map((day) => {
                const incH = Math.round((day.inc / maxBar) * 72);
                const expH = Math.round((day.exp / maxBar) * 72);
                return (
                  <div key={day.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                      {day.inc > 0 && (
                        <div style={{ width: "60%", height: incH, borderRadius: "4px 4px 0 0", background: tokens.tealGlow }} />
                      )}
                      {day.exp > 0 && (
                        <div style={{ width: "60%", height: expH, borderRadius: "0 0 4px 4px", background: tokens.amber }} />
                      )}
                      {day.inc === 0 && day.exp === 0 && (
                        <div style={{ width: "60%", height: 4, borderRadius: 999, background: "rgba(255,255,255,0.1)" }} />
                      )}
                    </div>
                    <span className="qw-muted" style={{ fontSize: "0.6rem" }}>{day.label}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: tokens.tealGlow }} />
                <span className="qw-muted" style={{ fontSize: "0.68rem" }}>Entradas</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: tokens.amber }} />
                <span className="qw-muted" style={{ fontSize: "0.68rem" }}>Salidas</span>
              </div>
            </div>
          </QuantumCard>
        </motion.div>

        {/* Categorías de gasto */}
        <motion.div {...fadeUp}>
          <QuantumCard title="Distribución de gastos">
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {(["all", "fixed", "variable"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`qw-pill ${activeCategory === cat ? "is-active" : ""}`}
                  style={{ fontSize: "0.78rem" }}
                >
                  {cat === "all" ? "Todo" : cat === "fixed" ? "Fijo" : "Variable"}
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {filteredCategories.map((cat) => (
                <div key={cat.id}>
                  <div className="qw-row" style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: "0.84rem" }}>{cat.label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "0.72rem", color: cat.type === "fixed" ? "rgba(79,124,255,0.9)" : tokens.amber }}>
                        {cat.type === "fixed" ? "Fijo" : "Variable"}
                      </span>
                      <PrivacyNumber value={cat.amount} format="currency" size="sm" />
                    </div>
                  </div>
                  <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.pct}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      style={{
                        height: "100%",
                        borderRadius: 999,
                        background: cat.type === "fixed" ? "rgba(79,124,255,0.6)" : tokens.amber
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </QuantumCard>
        </motion.div>

        {/* Transacciones recientes */}
        <motion.div {...fadeUp}>
          <QuantumCard title="Recientes">
            <div style={{ display: "grid", gap: 6 }}>
              {recent.map((tx) => (
                <div key={tx.id} className="qw-row" style={{ padding: "8px 10px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center",
                      background: tx.direction === "in" ? tokens.tealFaint : tokens.amberFaint,
                      fontSize: "0.78rem"
                    }}>
                      {tx.direction === "in" ? "↑" : "↓"}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.84rem" }}>{tx.label}</div>
                      <SourceBadge type={tx.sourceType} />
                    </div>
                  </div>
                  <PrivacyNumber value={Math.abs(tx.amount)} format="currency" size="sm" />
                </div>
              ))}
            </div>
          </QuantumCard>
        </motion.div>

      </section>
    </StateGate>
  );
}
