"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import MiniSparkline from "@/components/charts/MiniSparkline";
import TopTabs from "@/components/navigation/TopTabs";
import QuantumCard from "@/components/ui/QuantumCard";
import PrivacyNumber from "@/components/ui/PrivacyNumber";
import SourceBadge from "@/components/ui/SourceBadge";
import StateGate from "@/components/ui/StateGate";
import { fadeUp } from "@/lib/motion";
import { filterFrontierHoldings } from "@/state/selectors";
import { useQuantumStore } from "@/state/store";
import { tokens } from "@/styles/tokens";

const tabs = [
  { id: "exchanges", label: "Casas de cambio" },
  { id: "wallets", label: "Carteras" },
  { id: "defi", label: "DeFi" }
];

export default function FrontierPage() {
  const holdings = useQuantumStore((s) => s.holdings);
  const frontierTab = useQuantumStore((s) => s.frontierTab);
  const setFrontierTab = useQuantumStore((s) => s.setFrontierTab);
  const screenState = useQuantumStore((s) => s.screenState);
  const connectors = useQuantumStore((s) => s.connectors);

  const rows = filterFrontierHoldings(holdings, frontierTab);

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const totalWeight = holdings.reduce((sum, h) => sum + h.value, 0) || 1;
  const aggregateChangePct = holdings.reduce((sum, h) => sum + (h.changePct * h.value) / totalWeight, 0);

  const cryptoConnectors = connectors.filter((c) => c.type === "exchange" || c.type === "wallet");

  return (
    <StateGate state={screenState}>
      <section className="qw-screen">

        {/* Hero */}
        <motion.div {...fadeUp}>
          <QuantumCard disableGlow>
            <p className="qw-kicker" style={{ margin: 0 }}>Frontera Digital · Total</p>
            <PrivacyNumber value={totalValue} format="currency" size="lg" />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "3px 10px", borderRadius: 999,
                background: aggregateChangePct >= 0 ? tokens.tealFaint : tokens.coralFaint,
                border: `1px solid ${aggregateChangePct >= 0 ? tokens.tealBorder : tokens.coralBorder}`,
                fontSize: "0.84rem", fontWeight: 700,
                color: aggregateChangePct >= 0 ? tokens.tealGlow : tokens.coral
              }}>
                {aggregateChangePct >= 0 ? "+" : ""}{aggregateChangePct.toFixed(2)}% hoy
              </div>
              {cryptoConnectors.map((c) => (
                <div key={c.id} style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "2px 8px", borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.03)",
                  fontSize: "0.72rem", color: tokens.textMuted
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: 999,
                    background: c.status === "connected" ? tokens.tealGlow : tokens.amber,
                    boxShadow: `0 0 6px ${c.status === "connected" ? tokens.tealGlow : tokens.amber}`
                  }} />
                  {c.name}
                </div>
              ))}
            </div>
          </QuantumCard>
        </motion.div>

        <motion.div {...fadeUp}>
          <QuantumCard title="Frontera Digital">
            <TopTabs tabs={tabs} active={frontierTab} onChange={(id) => setFrontierTab(id as "exchanges" | "wallets" | "defi")} />
          </QuantumCard>
        </motion.div>

        <motion.div {...fadeUp}>
          <QuantumCard title="Posiciones">
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
              {rows.map((row) => (
                <li key={row.id} style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: 10 }}>
                  <div className="qw-row">
                    <strong>{row.symbol}</strong>
                    <SourceBadge type={frontierTab === "exchanges" ? "exchange" : frontierTab === "wallets" ? "wallet" : "defi"} />
                  </div>
                  <div className="qw-row" style={{ marginTop: 6 }}>
                    <span className="qw-muted">Red {row.network || "ETH"}</span>
                    <PrivacyNumber value={row.value} format="currency" size="sm" />
                  </div>
                  <MiniSparkline data={row.sparkline} />
                  <Link href={`/copilot?symbol=${row.symbol}&prefill=simulate`} className="qw-pill" style={{ display: "inline-block", marginTop: 8 }}>
                    Simular
                  </Link>
                </li>
              ))}
            </ul>
          </QuantumCard>
        </motion.div>
      </section>
    </StateGate>
  );
}
