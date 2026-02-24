"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import DetailDrawer from "@/components/drawers/DetailDrawer";
import QuantumCard from "@/components/ui/QuantumCard";
import SourceBadge from "@/components/ui/SourceBadge";
import StateGate from "@/components/ui/StateGate";
import { fadeUp } from "@/lib/motion";
import { filterTransactions } from "@/state/selectors";
import { useQuantumStore } from "@/state/store";
import type { ConnectorType } from "@/types/domain";

const sources: ("all" | ConnectorType)[] = ["all", "bank", "broker", "exchange", "wallet", "defi"];
const sourceLabels: Record<(typeof sources)[number], string> = {
  all: "Todo",
  bank: "Banco",
  broker: "Corredor",
  exchange: "Casa de cambio",
  wallet: "Cartera",
  defi: "DeFi"
};

export default function LogPage() {
  const transactions = useQuantumStore((s) => s.transactions);
  const logSource = useQuantumStore((s) => s.logSource);
  const setLogSource = useQuantumStore((s) => s.setLogSource);
  const logQuery = useQuantumStore((s) => s.logQuery);
  const setLogQuery = useQuantumStore((s) => s.setLogQuery);
  const screenState = useQuantumStore((s) => s.screenState);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const rows = useMemo(() => filterTransactions(transactions, logSource, logQuery), [transactions, logSource, logQuery]);

  const grouped = useMemo(() => {
    return rows.reduce<Record<string, typeof rows>>((acc, tx) => {
      const key = tx.date.slice(0, 10);
      if (!acc[key]) acc[key] = [];
      acc[key].push(tx);
      return acc;
    }, {});
  }, [rows]);

  const selected = rows.find((tx) => tx.id === selectedId);

  return (
    <StateGate state={screenState}>
      <section className="qw-screen">
        <motion.div {...fadeUp}>
          <QuantumCard title="Bitácora de Síntesis">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {sources.map((source) => (
                <button key={source} type="button" className={`qw-pill ${logSource === source ? "is-active" : ""}`} onClick={() => setLogSource(source)}>
                  {sourceLabels[source]}
                </button>
              ))}
            </div>
            <input
              value={logQuery}
              onChange={(event) => setLogQuery(event.target.value)}
              placeholder="Buscar comercio / ticker / hash"
              style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(245,245,245,0.14)", background: "rgba(245,245,245,0.03)", color: "#f5f5f5", padding: "10px 12px" }}
            />
          </QuantumCard>
        </motion.div>

        <motion.div {...fadeUp}>
          <QuantumCard title="Línea temporal">
            <div style={{ display: "grid", gap: 12, maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
              {Object.entries(grouped).map(([day, items]) => (
                <div key={day}>
                  <p className="qw-kicker">{day}</p>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 7 }}>
                    {items.map((tx) => (
                      <li key={tx.id}>
                        <button type="button" onClick={() => setSelectedId(tx.id)} style={{ width: "100%", borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", color: "inherit", padding: 10, textAlign: "left" }}>
                          <div className="qw-row">
                            <span>{tx.label}</span>
                            <span className="qw-muted">{tx.amount.toFixed(0)}</span>
                          </div>
                          <SourceBadge type={tx.sourceType} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </QuantumCard>
        </motion.div>
      </section>

      <DetailDrawer open={Boolean(selected)} title={selected?.label || "Transacción"} subtitle={selected?.hash || selected?.symbol || selected?.date} onClose={() => setSelectedId(null)} />
    </StateGate>
  );
}
