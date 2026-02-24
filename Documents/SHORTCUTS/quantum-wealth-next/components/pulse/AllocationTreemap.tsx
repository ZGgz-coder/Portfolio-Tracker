"use client";

import { motion } from "framer-motion";
import PrivacyNumber from "@/components/ui/PrivacyNumber";
import QuantumCard from "@/components/ui/QuantumCard";
import { tokens } from "@/styles/tokens";
import type { AllocationNode } from "@/types/pulse";

type Rect = {
  node: AllocationNode;
  x: number;
  y: number;
  w: number;
  h: number;
  depth: number;
};

function sliceDice(nodes: AllocationNode[], x: number, y: number, w: number, h: number, depth = 0): Rect[] {
  const total = nodes.reduce((sum, item) => sum + item.value, 0) || 1;
  const sorted = [...nodes].sort((a, b) => b.value - a.value);

  let offset = 0;
  const horizontal = depth % 2 === 0;

  return sorted.map((node) => {
    const ratio = node.value / total;
    const rect = horizontal
      ? { x: x + offset * w, y, w: w * ratio, h }
      : { x, y: y + offset * h, w, h: h * ratio };

    offset += ratio;
    return { node, ...rect, depth };
  });
}

export default function AllocationTreemap({
  data,
  selectedId,
  onSelect
}: {
  data: AllocationNode[];
  selectedId?: string;
  onSelect?: (nodeId: string) => void;
}) {
  const total = data.reduce((sum, node) => sum + node.value, 0) || 1;
  const rects = sliceDice(data, 0, 0, 100, 100, 0);
  const selected = data.find((node) => node.id === selectedId) || null;

  return (
    <QuantumCard title="Treemap de Asignación" rightSlot={<span className="qw-muted">tap para detalle</span>}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 16, overflow: "hidden", background: "#101010" }}>
        {rects.map((rect, idx) => {
          const pct = (rect.node.value / total) * 100;
          const active = selectedId === rect.node.id;
          return (
            <motion.button
              layout
              key={rect.node.id}
              type="button"
              onClick={() => onSelect?.(rect.node.id)}
              style={{
                position: "absolute",
                left: `${rect.x}%`,
                top: `${rect.y}%`,
                width: `${rect.w}%`,
                height: `${rect.h}%`,
                border: active ? "1px solid rgba(201,162,39,0.8)" : "1px solid rgba(255,255,255,0.06)",
                background: `linear-gradient(140deg, rgba(255,255,255,0.02), rgba(201,162,39,${0.04 + idx * 0.015}))`,
                color: tokens.textPrimary,
                textAlign: "left",
                padding: 8,
                overflow: "hidden"
              }}
            >
              <div style={{ fontSize: "0.72rem", opacity: 0.85 }}>{rect.node.label}</div>
              <div style={{ marginTop: 2, fontSize: "0.72rem", color: tokens.textMuted }}>
                <PrivacyNumber value={pct} format="percent" size="sm" />
              </div>
            </motion.button>
          );
        })}
      </div>

      {selected ? (
        <motion.div layout style={{ marginTop: 10, border: "1px solid rgba(255,255,255,0.09)", borderRadius: 14, padding: 10 }}>
          <div className="qw-row" style={{ marginBottom: 8 }}>
            <strong>{selected.label}</strong>
            <PrivacyNumber value={selected.value} format="currency" size="sm" />
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {(selected.children || []).map((child) => {
              const max = Math.max(...(selected.children || []).map((c) => c.value), 1);
              const bar = (child.value / max) * 100;
              return (
                <div key={child.id} style={{ display: "grid", gap: 4 }}>
                  <div className="qw-row">
                    <span className="qw-muted">{child.label}</span>
                    <PrivacyNumber value={child.value} format="currency" size="sm" />
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    <div style={{ width: `${bar}%`, height: "100%", background: "rgba(201,162,39,0.45)" }} />
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
