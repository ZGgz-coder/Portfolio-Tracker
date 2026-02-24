"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import BarCashflow from "@/components/charts/BarCashflow";
import DetailDrawer from "@/components/drawers/DetailDrawer";
import QuantumCard from "@/components/ui/QuantumCard";
import PrivacyNumber from "@/components/ui/PrivacyNumber";
import SourceBadge from "@/components/ui/SourceBadge";
import StateGate from "@/components/ui/StateGate";
import { fadeUp } from "@/lib/motion";
import { useQuantumStore } from "@/state/store";

const weekData = [
  { label: "Lun", value: 420 },
  { label: "Mar", value: 180 },
  { label: "Mié", value: 390 },
  { label: "Jue", value: 270 },
  { label: "Vie", value: 510 }
];

const monthData = [
  { label: "S1", value: 1100 },
  { label: "S2", value: 1380 },
  { label: "S3", value: 980 },
  { label: "S4", value: 1520 }
];

export default function LiquidPage() {
  const accounts = useQuantumStore((s) => s.accounts);
  const transactions = useQuantumStore((s) => s.transactions);
  const cashflowWindow = useQuantumStore((s) => s.cashflowWindow);
  const setCashflowWindow = useQuantumStore((s) => s.setCashflowWindow);
  const screenState = useQuantumStore((s) => s.screenState);

  const [selectedTx, setSelectedTx] = useState<string | null>(null);

  const selected = transactions.find((tx) => tx.id === selectedTx);
  const data = cashflowWindow === "week" ? weekData : monthData;

  const recent = useMemo(() => transactions.slice(0, 8), [transactions]);

  return (
    <StateGate state={screenState}>
      <section className="qw-screen">
        <motion.div {...fadeUp}>
          <QuantumCard title="Tarjetas">
            <div style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "75%", gap: 8, overflowX: "auto" }}>
              {accounts.map((account) => (
                <article key={account.id} style={{ padding: 12, borderRadius: 18, background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.35)" }}>
                  <p className="qw-kicker">{account.name}</p>
                  <PrivacyNumber value={account.balance} format="currency" />
                </article>
              ))}
            </div>
          </QuantumCard>
        </motion.div>

        <motion.div {...fadeUp}>
          <QuantumCard title="Flujo de Caja" rightSlot={<div style={{ display: "flex", gap: 6 }}>
            <button type="button" className={`qw-pill ${cashflowWindow === "week" ? "is-active" : ""}`} onClick={() => setCashflowWindow("week")}>Semana</button>
            <button type="button" className={`qw-pill ${cashflowWindow === "month" ? "is-active" : ""}`} onClick={() => setCashflowWindow("month")}>Mes</button>
          </div>}>
            <BarCashflow data={data} />
          </QuantumCard>
        </motion.div>

        <motion.div {...fadeUp}>
          <QuantumCard title="Transacciones Recientes">
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
              {recent.map((tx) => (
                <li key={tx.id}>
                  <button type="button" onClick={() => setSelectedTx(tx.id)} style={{ width: "100%", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 10, color: "inherit", textAlign: "left" }}>
                    <div className="qw-row">
                      <span>{tx.label}</span>
                      <PrivacyNumber value={tx.amount} format="currency" size="sm" />
                    </div>
                    <SourceBadge type={tx.sourceType} />
                  </button>
                </li>
              ))}
            </ul>
          </QuantumCard>
        </motion.div>
      </section>

      <DetailDrawer open={Boolean(selected)} title={selected?.label || "Transacción"} subtitle={selected?.date} onClose={() => setSelectedTx(null)} />
    </StateGate>
  );
}
