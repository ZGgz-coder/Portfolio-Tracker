"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import DetailDrawer from "@/components/drawers/DetailDrawer";
import QuantumCard from "@/components/ui/QuantumCard";
import PrivacyNumber from "@/components/ui/PrivacyNumber";
import SourceBadge from "@/components/ui/SourceBadge";
import StateGate from "@/components/ui/StateGate";
import { fadeUp } from "@/lib/motion";
import { filterTransactions } from "@/state/selectors";
import { useQuantumStore } from "@/state/store";
import { tokens } from "@/styles/tokens";
import type { ConnectorType } from "@/types/domain";

const sources: ("all" | ConnectorType)[] = ["all", "bank", "broker", "exchange", "wallet", "defi"];
const sourceLabels: Record<(typeof sources)[number], string> = {
  all: "Todo", bank: "Banco", broker: "Broker",
  exchange: "Exchange", wallet: "Wallet", defi: "DeFi"
};

const connectorTypeLabels: Record<string, string> = {
  bank: "Banco", broker: "Broker", exchange: "Exchange", wallet: "Cartera", defi: "DeFi"
};

export default function NexusPage() {
  const screenState = useQuantumStore((s) => s.screenState);
  const goals = useQuantumStore((s) => s.goals);
  const connectors = useQuantumStore((s) => s.connectors);
  const transactions = useQuantumStore((s) => s.transactions);
  const logSource = useQuantumStore((s) => s.logSource);
  const setLogSource = useQuantumStore((s) => s.setLogSource);
  const logQuery = useQuantumStore((s) => s.logQuery);
  const setLogQuery = useQuantumStore((s) => s.setLogQuery);
  const privacyMode = useQuantumStore((s) => s.privacyMode);
  const togglePrivacyMode = useQuantumStore((s) => s.togglePrivacyMode);

  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const rows = useMemo(() => filterTransactions(transactions, logSource, logQuery), [transactions, logSource, logQuery]);

  const grouped = useMemo(() => {
    return rows.reduce<Record<string, typeof rows>>((acc, tx) => {
      const key = tx.date.slice(0, 10);
      if (!acc[key]) acc[key] = [];
      acc[key].push(tx);
      return acc;
    }, {});
  }, [rows]);

  const selectedTx = rows.find((tx) => tx.id === selectedTxId);

  const statusConfig = {
    connected: { color: tokens.tealGlow, label: "Conectado", dot: tokens.tealGlow },
    warning: { color: tokens.amber, label: "Atención", dot: tokens.amber },
    disconnected: { color: tokens.coral, label: "Desconectado", dot: tokens.coral }
  };

  return (
    <StateGate state={screenState}>
      <section className="qw-screen">

        {/* Metas financieras */}
        <motion.div {...fadeUp}>
          <QuantumCard
            title="Metas financieras"
            rightSlot={
              <button type="button" className="qw-pill" style={{ fontSize: "0.72rem" }}>
                + Nueva
              </button>
            }
          >
            <div style={{ display: "grid", gap: 10 }}>
              {goals.map((goal) => {
                const pct = Math.min((goal.current / goal.target) * 100, 100);
                const isComplete = pct >= 100;
                const remaining = goal.target - goal.current;
                return (
                  <div key={goal.id} style={{
                    padding: "10px 12px", borderRadius: 14,
                    background: isComplete ? tokens.tealFaint : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isComplete ? tokens.tealBorder : "rgba(255,255,255,0.08)"}`
                  }}>
                    <div className="qw-row" style={{ marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "1.1rem" }}>{goal.emoji}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.84rem" }}>{goal.label}</div>
                          <div className="qw-muted" style={{ fontSize: "0.68rem" }}>
                            {isComplete ? "¡Completado!" : `Faltan €${remaining.toLocaleString("es-ES", { maximumFractionDigits: 0 })}`}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <PrivacyNumber value={goal.current} format="currency" size="sm" />
                        <div className="qw-muted" style={{ fontSize: "0.68rem" }}>
                          de <PrivacyNumber value={goal.target} format="currency" size="sm" />
                        </div>
                      </div>
                    </div>
                    <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        style={{
                          height: "100%", borderRadius: 999,
                          background: isComplete ? tokens.tealGlow : tokens.gold,
                          boxShadow: isComplete ? `0 0 10px ${tokens.tealGlow}` : `0 0 10px ${tokens.gold}88`
                        }}
                      />
                    </div>
                    <div style={{ marginTop: 4, textAlign: "right" }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, color: isComplete ? tokens.tealGlow : tokens.gold }}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </QuantumCard>
        </motion.div>

        {/* Salud del sistema */}
        <motion.div {...fadeUp}>
          <QuantumCard
            title="Salud del sistema"
            rightSlot={
              <button type="button" className="qw-pill" style={{ fontSize: "0.72rem" }}>
                + Conectar
              </button>
            }
          >
            <div style={{ display: "grid", gap: 8 }}>
              {connectors.map((connector) => {
                const cfg = statusConfig[connector.status] || statusConfig.disconnected;
                const syncDate = new Date(connector.lastSyncAt);
                const minutesAgo = Math.round((Date.now() - syncDate.getTime()) / 60000);
                const syncLabel = minutesAgo < 60
                  ? `hace ${minutesAgo}m`
                  : minutesAgo < 1440
                  ? `hace ${Math.round(minutesAgo / 60)}h`
                  : `hace ${Math.round(minutesAgo / 1440)}d`;

                return (
                  <div key={connector.id} className="qw-row" style={{
                    padding: "10px 12px", borderRadius: 14,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.08)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: 999,
                        background: cfg.dot,
                        boxShadow: `0 0 8px ${cfg.dot}`
                      }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.84rem" }}>{connector.name}</div>
                        <div className="qw-muted" style={{ fontSize: "0.68rem" }}>
                          {connectorTypeLabels[connector.type] ?? connector.type}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 600, color: cfg.color }}>{cfg.label}</div>
                      <div className="qw-muted" style={{ fontSize: "0.64rem" }}>{syncLabel}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </QuantumCard>
        </motion.div>

        {/* Bitácora */}
        <motion.div {...fadeUp}>
          <QuantumCard title="Bitácora">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {sources.map((source) => (
                <button
                  key={source}
                  type="button"
                  onClick={() => setLogSource(source)}
                  className={`qw-pill ${logSource === source ? "is-active" : ""}`}
                  style={{ fontSize: "0.74rem" }}
                >
                  {sourceLabels[source]}
                </button>
              ))}
            </div>
            <input
              value={logQuery}
              onChange={(e) => setLogQuery(e.target.value)}
              placeholder="Buscar ticker / comercio / hash..."
              style={{
                width: "100%", borderRadius: 12,
                border: "1px solid rgba(245,245,245,0.14)",
                background: "rgba(245,245,245,0.03)",
                color: tokens.textPrimary, padding: "9px 12px",
                marginBottom: 10, fontSize: "0.82rem"
              }}
            />
            <div style={{ display: "grid", gap: 10, maxHeight: 380, overflowY: "auto", paddingRight: 2 }}>
              {Object.entries(grouped).map(([day, items]) => (
                <div key={day}>
                  <div className="qw-kicker" style={{ marginBottom: 5 }}>{day}</div>
                  <div style={{ display: "grid", gap: 5 }}>
                    {items.map((tx) => (
                      <button
                        key={tx.id}
                        type="button"
                        onClick={() => setSelectedTxId(tx.id)}
                        style={{
                          width: "100%", borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.09)",
                          background: "rgba(255,255,255,0.02)",
                          color: "inherit", padding: "8px 10px", textAlign: "left"
                        }}
                      >
                        <div className="qw-row">
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                              width: 26, height: 26, borderRadius: 7,
                              display: "grid", placeItems: "center",
                              background: tx.direction === "in" ? tokens.tealFaint : tokens.amberFaint,
                              fontSize: "0.75rem", flexShrink: 0
                            }}>
                              {tx.direction === "in" ? "↑" : "↓"}
                            </div>
                            <div>
                              <div style={{ fontSize: "0.8rem" }}>{tx.label}</div>
                              <SourceBadge type={tx.sourceType} />
                            </div>
                          </div>
                          <span style={{
                            fontSize: "0.8rem", fontWeight: 600,
                            color: tx.direction === "in" ? tokens.tealGlow : tokens.amber
                          }}>
                            {tx.direction === "in" ? "+" : "−"}€{Math.abs(tx.amount).toFixed(0)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </QuantumCard>
        </motion.div>

        {/* Privacidad */}
        <motion.div {...fadeUp}>
          <QuantumCard disableGlow>
            <div className="qw-row">
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>Modo privacidad</div>
                <div className="qw-muted" style={{ fontSize: "0.72rem", marginTop: 2 }}>
                  {privacyMode ? "Datos ocultos en toda la app" : "Datos visibles en toda la app"}
                </div>
              </div>
              <button
                type="button"
                onClick={togglePrivacyMode}
                style={{
                  width: 50, height: 28, borderRadius: 999,
                  border: "none", cursor: "pointer",
                  background: privacyMode ? tokens.gold : "rgba(255,255,255,0.12)",
                  position: "relative", transition: "background 250ms ease"
                }}
              >
                <motion.div
                  animate={{ x: privacyMode ? 22 : 2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  style={{
                    position: "absolute", top: 3, left: 0,
                    width: 22, height: 22, borderRadius: 999,
                    background: privacyMode ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.85)"
                  }}
                />
              </button>
            </div>
          </QuantumCard>
        </motion.div>

      </section>

      <DetailDrawer
        open={Boolean(selectedTx)}
        title={selectedTx?.label ?? "Transacción"}
        subtitle={selectedTx?.hash ?? selectedTx?.symbol ?? selectedTx?.date}
        onClose={() => setSelectedTxId(null)}
      />
    </StateGate>
  );
}
