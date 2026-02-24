"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import QuantumCard from "@/components/ui/QuantumCard";
import PrivacyNumber from "@/components/ui/PrivacyNumber";
import StateGate from "@/components/ui/StateGate";
import { fadeUp } from "@/lib/motion";
import { selectHeatMap, selectTopMovers, selectPulseVolatility, selectPulseDrawdown, selectPulseSeries } from "@/state/selectors";
import { useQuantumStore } from "@/state/store";
import { tokens } from "@/styles/tokens";

function heatColor(score: number): string {
  // score: -1 (deep red) → 0 (neutral) → +1 (green)
  if (score > 0.15) return `rgba(42,167,161,${0.55 + score * 0.4})`;
  if (score < -0.15) return `rgba(220,60,60,${0.55 + Math.abs(score) * 0.4})`;
  return "rgba(255,255,255,0.06)";
}

export default function ArenaPage() {
  const screenState = useQuantumStore((s) => s.screenState);
  const holdings = useQuantumStore((s) => s.holdings);
  const pulseRange = useQuantumStore((s) => s.filters.pulseRange);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const heatMap = useMemo(() => selectHeatMap(holdings), [holdings]);
  const movers = useMemo(() => selectTopMovers(holdings), [holdings]);
  const series = useMemo(() => selectPulseSeries(pulseRange), [pulseRange]);
  const volatility = useMemo(() => selectPulseVolatility(series), [series]);
  const drawdown = useMemo(() => selectPulseDrawdown(series), [series]);

  const totalInvested = holdings.reduce((sum, h) => sum + h.value, 0);
  const totalPnL = holdings.reduce((sum, h) => sum + (h.value * h.changePct) / 100, 0);
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  // Alpha vs benchmark (S&P500 approx +1.1% today from SPY holding)
  const spyChange = holdings.find((h) => h.symbol === "SPY")?.changePct ?? 1.1;
  const alphaVsBenchmark = totalPnLPct - spyChange;

  const maxConcentration = Math.max(...heatMap.map((h) => h.sizeWeight));

  const selected = holdings.find((h) => h.id === selectedId);

  const isPositive = totalPnL >= 0;

  return (
    <StateGate state={screenState}>
      <section className="qw-screen">

        {/* Hero */}
        <motion.div {...fadeUp}>
          <QuantumCard disableGlow>
            <p className="qw-kicker" style={{ margin: 0 }}>La Bóveda · Portafolio total</p>
            <PrivacyNumber value={totalInvested} format="currency" size="lg" />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "3px 10px", borderRadius: 999,
                background: isPositive ? tokens.tealFaint : tokens.coralFaint,
                border: `1px solid ${isPositive ? tokens.tealBorder : tokens.coralBorder}`,
                fontSize: "0.84rem", fontWeight: 700,
                color: isPositive ? tokens.tealGlow : tokens.coral
              }}>
                {isPositive ? "+" : ""}{totalPnL.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
                <span style={{ opacity: 0.8 }}>({isPositive ? "+" : ""}{totalPnLPct.toFixed(2)}%)</span>
              </div>
              <span className="qw-muted" style={{ fontSize: "0.7rem" }}>hoy</span>
            </div>
          </QuantumCard>
        </motion.div>

        {/* Heat map */}
        <motion.div {...fadeUp}>
          <QuantumCard title="Mapa de posiciones" rightSlot={<span className="qw-muted" style={{ fontSize: "0.72rem" }}>tamaño = peso</span>}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, width: "100%" }}>
              {heatMap.map((h) => {
                const isActive = selectedId === h.id;
                const minSize = 52;
                const size = Math.max(minSize, (h.sizeWeight / 100) * 320);
                return (
                  <motion.button
                    key={h.id}
                    type="button"
                    onClick={() => setSelectedId(isActive ? null : h.id)}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      width: size,
                      height: size * 0.7,
                      borderRadius: 14,
                      background: heatColor(h.colorScore),
                      border: isActive ? `1.5px solid ${tokens.gold}` : "1px solid rgba(255,255,255,0.1)",
                      boxShadow: isActive ? `0 0 14px ${tokens.gold}55` : "none",
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                      color: "inherit",
                      padding: 6,
                      flexShrink: 0,
                      transition: "all 160ms ease"
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>{h.symbol}</div>
                      <div style={{ fontSize: "0.68rem", opacity: 0.85, marginTop: 2 }}>
                        {h.changePct >= 0 ? "+" : ""}{h.changePct.toFixed(1)}%
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Selected detail */}
            {selected && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: 10, padding: "10px 12px", borderRadius: 14, background: "rgba(201,162,39,0.06)", border: "1px solid rgba(201,162,39,0.22)" }}
              >
                <div className="qw-row">
                  <div>
                    <div style={{ fontWeight: 700 }}>{selected.name}</div>
                    <div className="qw-muted" style={{ fontSize: "0.72rem" }}>{selected.symbol} · {selected.assetClass}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <PrivacyNumber value={selected.value} format="currency" size="sm" />
                    <div style={{ fontSize: "0.72rem", color: selected.changePct >= 0 ? tokens.tealGlow : tokens.coral }}>
                      {selected.changePct >= 0 ? "+" : ""}{selected.changePct.toFixed(2)}% hoy
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </QuantumCard>
        </motion.div>

        {/* Alpha + Risk */}
        <motion.div {...fadeUp}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <QuantumCard disableGlow>
              <div className="qw-muted" style={{ fontSize: "0.68rem", marginBottom: 4 }}>Alpha vs S&P500</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: alphaVsBenchmark >= 0 ? tokens.tealGlow : tokens.coral }}>
                {alphaVsBenchmark >= 0 ? "+" : ""}{alphaVsBenchmark.toFixed(2)}%
              </div>
              <div className="qw-muted" style={{ fontSize: "0.68rem", marginTop: 2 }}>últimas 24h</div>
            </QuantumCard>
            <QuantumCard disableGlow>
              <div className="qw-muted" style={{ fontSize: "0.68rem", marginBottom: 4 }}>Concentración</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: maxConcentration > 30 ? tokens.amber : tokens.textPrimary }}>
                {maxConcentration.toFixed(0)}%
              </div>
              <div className="qw-muted" style={{ fontSize: "0.68rem", marginTop: 2 }}>mayor posición</div>
            </QuantumCard>
          </div>
        </motion.div>

        {/* Risk radar */}
        <motion.div {...fadeUp}>
          <QuantumCard title="Radar de riesgo">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[
                { label: "Volatilidad", value: `${volatility.toFixed(2)}%`, status: volatility > 1 ? "warning" : "ok" },
                { label: "Max Drawdown", value: `-${drawdown.toFixed(1)}%`, status: drawdown > 5 ? "danger" : drawdown > 2 ? "warning" : "ok" },
                { label: "Concentración", value: `${maxConcentration.toFixed(0)}%`, status: maxConcentration > 35 ? "warning" : "ok" }
              ].map((metric) => {
                const color = metric.status === "danger" ? tokens.coral : metric.status === "warning" ? tokens.amber : tokens.tealGlow;
                return (
                  <div key={metric.label} style={{ padding: "8px 10px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: `1px solid ${color}33` }}>
                    <div className="qw-muted" style={{ fontSize: "0.64rem", marginBottom: 4 }}>{metric.label}</div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color }}>{metric.value}</div>
                    <div style={{ width: 6, height: 6, borderRadius: 999, background: color, marginTop: 4 }} />
                  </div>
                );
              })}
            </div>
          </QuantumCard>
        </motion.div>

        {/* Top movers */}
        <motion.div {...fadeUp}>
          <QuantumCard title="Movers de hoy">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div className="qw-muted" style={{ fontSize: "0.68rem", marginBottom: 6 }}>↑ Mejores</div>
                <div style={{ display: "grid", gap: 6 }}>
                  {movers.winners.map((h) => (
                    <div key={h.id} className="qw-row" style={{ padding: "6px 8px", borderRadius: 10, background: tokens.tealFaint, border: `1px solid ${tokens.tealBorder}` }}>
                      <span style={{ fontWeight: 700, fontSize: "0.84rem" }}>{h.symbol}</span>
                      <span style={{ fontSize: "0.78rem", color: tokens.tealGlow, fontWeight: 600 }}>+{h.changePct.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="qw-muted" style={{ fontSize: "0.68rem", marginBottom: 6 }}>↓ Peores</div>
                <div style={{ display: "grid", gap: 6 }}>
                  {movers.losers.map((h) => (
                    <div key={h.id} className="qw-row" style={{ padding: "6px 8px", borderRadius: 10, background: tokens.coralFaint, border: `1px solid ${tokens.coralBorder}` }}>
                      <span style={{ fontWeight: 700, fontSize: "0.84rem" }}>{h.symbol}</span>
                      <span style={{ fontSize: "0.78rem", color: tokens.coral, fontWeight: 600 }}>{h.changePct.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </QuantumCard>
        </motion.div>

      </section>
    </StateGate>
  );
}
