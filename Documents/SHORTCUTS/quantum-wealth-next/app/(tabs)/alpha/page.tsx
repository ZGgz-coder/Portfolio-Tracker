"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import MiniSparkline from "@/components/charts/MiniSparkline";
import QuantumCard from "@/components/ui/QuantumCard";
import PrivacyNumber from "@/components/ui/PrivacyNumber";
import StateGate from "@/components/ui/StateGate";
import { fadeUp } from "@/lib/motion";
import { sortAlphaHoldings } from "@/state/selectors";
import { useQuantumStore } from "@/state/store";

const SORT_LABELS = {
  value: "Valor",
  change: "Cambio",
  name: "Nombre"
} as const;

export default function AlphaPage() {
  const holdings = useQuantumStore((s) => s.holdings);
  const alphaSort = useQuantumStore((s) => s.alphaSort);
  const setAlphaSort = useQuantumStore((s) => s.setAlphaSort);
  const screenState = useQuantumStore((s) => s.screenState);

  const [showBenchmark, setShowBenchmark] = useState(true);
  const [activeHolding, setActiveHolding] = useState<string | null>(null);

  const sorted = useMemo(() => sortAlphaHoldings(holdings, alphaSort), [holdings, alphaSort]);
  const total = sorted.reduce((sum, h) => sum + h.value, 0);
  const active = sorted.find((h) => h.id === activeHolding) || sorted[0];

  return (
    <StateGate state={screenState}>
      <section className="qw-screen">
        <motion.div {...fadeUp}>
          <p className="qw-kicker">La Bóveda Alpha</p>
          <PrivacyNumber value={total} format="currency" size="lg" />
        </motion.div>

        <motion.div {...fadeUp}>
          <QuantumCard
            title="Portafolio vs Benchmark"
            rightSlot={<button type="button" className={`qw-pill ${showBenchmark ? "is-active" : ""}`} onClick={() => setShowBenchmark((v) => !v)}>
              Benchmark
            </button>}
          >
            <MiniSparkline data={showBenchmark ? [91, 92.5, 93.1, 94.7, 95.4, 96.8] : [91, 92, 92.4, 93, 93.8, 94.1]} />
          </QuantumCard>
        </motion.div>

        <motion.div {...fadeUp}>
          <QuantumCard title="Posiciones" rightSlot={<div style={{ display: "flex", gap: 6 }}>
            {(["value", "change", "name"] as const).map((sort) => (
              <button key={sort} type="button" className={`qw-pill ${alphaSort === sort ? "is-active" : ""}`} onClick={() => setAlphaSort(sort)}>{SORT_LABELS[sort]}</button>
            ))}
          </div>}>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
              {sorted.map((holding) => (
                <li key={holding.id}>
                  <button type="button" onClick={() => setActiveHolding(holding.id)} style={{ width: "100%", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, background: "rgba(255,255,255,0.02)", color: "inherit", padding: 10 }}>
                    <div className="qw-row">
                      <span>{holding.symbol}</span>
                      <PrivacyNumber value={holding.value} format="currency" size="sm" />
                    </div>
                    <small className="qw-muted">{holding.changePct.toFixed(2)}%</small>
                  </button>
                </li>
              ))}
            </ul>
          </QuantumCard>
        </motion.div>

        <motion.div {...fadeUp}>
          <QuantumCard title="Detalle del Activo">
            <div className="qw-row">
              <strong>{active?.name}</strong>
              <span className="qw-muted">{active?.symbol}</span>
            </div>
            <MiniSparkline data={active?.sparkline || [95, 96, 97, 96, 97, 98]} />
          </QuantumCard>
        </motion.div>
      </section>
    </StateGate>
  );
}
