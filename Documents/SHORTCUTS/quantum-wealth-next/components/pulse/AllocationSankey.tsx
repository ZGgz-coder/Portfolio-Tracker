"use client";

import { motion } from "framer-motion";
import { Sankey, ResponsiveContainer, Tooltip } from "recharts";
import PrivacyNumber from "@/components/ui/PrivacyNumber";
import QuantumCard from "@/components/ui/QuantumCard";
import { tokens } from "@/styles/tokens";
import type { AllocationNode } from "@/types/pulse";

type SankeyGraph = {
  nodes: { name: string }[];
  links: { source: number; target: number; value: number }[];
};

type TooltipPayload = {
  payload?: {
    value?: number;
    source?: { name?: string };
    target?: { name?: string };
    name?: string;
  };
  name?: string;
  value?: number;
};

function SankeyTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const p = item.payload;
  const value = p?.value ?? item.value ?? 0;
  const label = p?.source?.name && p?.target?.name ? `${p.source.name} -> ${p.target.name}` : p?.name ?? item.name ?? "Value";

  return (
    <div
      style={{
        background: tokens.surface2,
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 12,
        padding: "8px 10px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.45)"
      }}
    >
      <div className="qw-muted" style={{ fontSize: "0.72rem", marginBottom: 2 }}>
        {label}
      </div>
      <PrivacyNumber value={Number(value)} format="currency" size="sm" />
    </div>
  );
}

export default function AllocationSankey({
  data,
  tree,
  selectedId,
  onSelect
}: {
  data: SankeyGraph;
  tree: AllocationNode[];
  selectedId?: string;
  onSelect?: (nodeId: string) => void;
}) {
  const selected =
    tree.find((node) => node.id === selectedId) ??
    tree.find((node) => node.children?.some((child) => child.id === selectedId)) ??
    null;

  const total = tree.reduce((sum, node) => sum + node.value, 0) || 1;

  return (
    <QuantumCard title="Allocation Flow" rightSlot={<span className="qw-muted">tap para detalle</span>}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <div style={{ width: "100%", height: 320, borderRadius: 16, background: "#0D0D0D", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
          <ResponsiveContainer width="100%" height="100%">
            <Sankey
              data={data}
              margin={{ top: 16, right: 16, bottom: 16, left: 16 }}
              nodePadding={22}
              nodeWidth={14}
              linkCurvature={0.45}
              sort
              node={{ fill: "rgba(245,245,245,0.16)", stroke: "rgba(201,162,39,0.3)", strokeWidth: 1, opacity: 0.95 }}
              link={{ stroke: "rgba(201,162,39,0.22)", fill: "none", opacity: 0.9 }}
              onClick={(element: { payload?: { name?: string } }) => {
                const name = element?.payload?.name;
                if (!name || name === "Net Worth") return;
                const top = tree.find((node) => node.label === name);
                if (top) {
                  onSelect?.(top.id);
                  return;
                }
                const parent = tree.find((node) => node.children?.some((child) => child.label === name));
                if (parent) onSelect?.(parent.id);
              }}
            >
              <Tooltip content={<SankeyTooltip />} />
            </Sankey>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {selected ? (
        <motion.div layout style={{ marginTop: 10, border: "1px solid rgba(255,255,255,0.09)", borderRadius: 14, padding: 10 }}>
          <div className="qw-row" style={{ marginBottom: 8 }}>
            <strong>{selected.label}</strong>
            <PrivacyNumber value={selected.value} format="currency" size="sm" />
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {(selected.children || []).map((child) => {
              const bar = (child.value / Math.max(selected.value, 1)) * 100;
              const pct = (child.value / total) * 100;
              return (
                <div key={child.id} style={{ display: "grid", gap: 4 }}>
                  <div className="qw-row">
                    <span className="qw-muted">{child.label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <PrivacyNumber value={pct} format="percent" size="sm" />
                      <PrivacyNumber value={child.value} format="currency" size="sm" />
                    </div>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    <div style={{ width: `${Math.max(3, bar)}%`, height: "100%", background: "rgba(201,162,39,0.45)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      ) : null}
    </QuantumCard>
  );
}
