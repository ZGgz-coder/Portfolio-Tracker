"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import DetailDrawer from "@/components/drawers/DetailDrawer";
import { Area, ComposedChart, Line, XAxis, YAxis, Tooltip as LineTooltip } from "recharts";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts";
import PrivacyNumber from "@/components/ui/PrivacyNumber";
import QuantumCard from "@/components/ui/QuantumCard";
import RangeChips from "@/components/pulse/RangeChips";
import { tokens } from "@/styles/tokens";
import type { AllocationNode, RangeKey, TimePoint } from "@/types/pulse";

type SliceDatum = {
  id: string;
  label: string;
  value: number;
  pct: number;
  parentPct?: number;
};

const RING_COLORS = [
  "rgba(201,162,39,0.92)",
  tokens.tealGlow,
  "rgba(79,124,255,0.9)",
  tokens.amber,
  "rgba(163,93,230,0.9)"
];

function IconEye({ muted }: { muted?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12C4.8 7.5 8.2 5.2 12 5.2C15.8 5.2 19.2 7.5 22 12C19.2 16.5 15.8 18.8 12 18.8C8.2 18.8 4.8 16.5 2 12Z" stroke={muted ? "rgba(160,160,160,0.95)" : "rgba(245,245,245,0.95)"} strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.2" fill={muted ? "rgba(160,160,160,0.95)" : "rgba(245,245,245,0.95)"} />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12C4.8 7.5 8.2 5.2 12 5.2C15.8 5.2 19.2 7.5 22 12C19.2 16.5 15.8 18.8 12 18.8C8.2 18.8 4.8 16.5 2 12Z" stroke="rgba(245,245,245,0.95)" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.2" fill="rgba(245,245,245,0.95)" />
      <path d="M4 20L20 4" stroke="rgba(201,162,39,0.95)" strokeWidth="1.8" />
    </svg>
  );
}

function AllocationTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload?: SliceDatum }> }) {
  if (!active || !payload?.length || !payload[0]?.payload) return null;
  const item = payload[0].payload;

  return (
    <div
      style={{
        background: tokens.surface2,
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: "8px 10px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.45)"
      }}
    >
      <div className="qw-muted" style={{ fontSize: "0.72rem", marginBottom: 2 }}>
        {item.label}
      </div>
      <div className="qw-row" style={{ gap: 8, justifyContent: "flex-start" }}>
        <PrivacyNumber value={item.pct} format="percent" size="sm" />
        <PrivacyNumber value={item.value} format="currency" size="sm" />
      </div>
    </div>
  );
}

export default function AllocationImpactRing({
  data,
  selectedId,
  onSelect,
  series,
  range,
  onRangeChange,
  value,
  deltaAbs,
  deltaPct,
  privacyMode,
  onTogglePrivacy,
  onAddConnector
}: {
  data: AllocationNode[];
  selectedId?: string;
  onSelect?: (nodeId: string) => void;
  series: TimePoint[];
  range: RangeKey;
  onRangeChange: (range: RangeKey) => void;
  value: number;
  deltaAbs: number;
  deltaPct: number;
  privacyMode: boolean;
  onTogglePrivacy: () => void;
  onAddConnector: () => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  const slices: SliceDatum[] = data
    .map((item) => ({
      id: item.id,
      label: item.label,
      value: item.value,
      pct: (item.value / total) * 100
    }))
    .sort((a, b) => b.value - a.value);

  const selected = data.find((item) => item.id === selectedId) ?? data[0] ?? null;
  const selectedTotal = Math.max(selected?.value ?? 0, 1);
  const selectedChildren: SliceDatum[] = (selected?.children ?? [])
    .filter((child) => child.value > 0)
    .map((child) => ({
      id: child.id,
      label: child.label,
      value: child.value,
      pct: (child.value / total) * 100,
      parentPct: (child.value / selectedTotal) * 100
    }))
    .sort((a, b) => b.value - a.value);

  const maxSlice = slices[0] ?? null;
  const activeIndex = Math.max(0, slices.findIndex((slice) => slice.id === (selected?.id ?? slices[0]?.id)));
  const selectedPct = selected ? (selected.value / total) * 100 : 100;

  const childColor = (index: number) => {
    const palette = [
      "rgba(245,245,245,0.82)",
      "rgba(245,245,245,0.64)",
      "rgba(245,245,245,0.5)",
      "rgba(245,245,245,0.36)",
      "rgba(245,245,245,0.24)"
    ];
    return palette[index % palette.length];
  };

  const topChildren = selectedChildren.slice(0, 5);

  return (
    <>
    <QuantumCard title="Constelación de Capital">
      {/* --- Patrimonio header --- */}
      <div className="qw-row" style={{ alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <p className="qw-kicker" style={{ margin: 0 }}>Patrimonio total · {range}</p>
          <PrivacyNumber value={value} format="currency" size="lg" />
          <div className="qw-row" style={{ justifyContent: "flex-start", gap: 10 }}>
            <PrivacyNumber value={deltaAbs} format="currency" size="sm" />
            <PrivacyNumber value={deltaPct} format="percent" size="sm" />
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            className="qw-pill"
            onClick={onTogglePrivacy}
            aria-label={privacyMode ? "Mostrar saldos" : "Ocultar saldos"}
            aria-pressed={privacyMode}
            style={{ width: 34, height: 34, padding: 0, display: "grid", placeItems: "center" }}
          >
            {privacyMode ? <IconEyeOff /> : <IconEye muted />}
          </button>
          <button type="button" className="qw-pill" onClick={onAddConnector} aria-label="Agregar conector" style={{ width: 34, height: 34, padding: 0, display: "grid", placeItems: "center" }}>
            ＋
          </button>
        </div>
      </div>

      {/* --- Mini sparkline --- */}
      <div style={{ width: "100%", height: 80, marginBottom: 6 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="pulseAreaMini" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={tokens.goldSoft} />
                <stop offset="100%" stopColor={tokens.goldFaint} />
              </linearGradient>
            </defs>
            <XAxis dataKey="t" hide />
            <YAxis hide domain={["dataMin - 1000", "dataMax + 1000"]} />
            <LineTooltip content={() => null} />
            <Area type="monotone" dataKey="v" stroke="none" fill="url(#pulseAreaMini)" />
            <Line type="monotone" dataKey="v" stroke={tokens.gold} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* --- Range chips --- */}
      <div style={{ marginBottom: 12 }}>
        <RangeChips range={range} onChange={onRangeChange} />
      </div>

      {/* --- Donut chart --- */}
      <div style={{ position: "relative" }}>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                <filter id="ringGlow">
                  <feGaussianBlur stdDeviation="3.2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="label"
                innerRadius={86}
                outerRadius={124}
                paddingAngle={2}
                activeIndex={activeIndex}
                activeShape={(props: { cx?: number; cy?: number; innerRadius?: number; outerRadius?: number; startAngle?: number; endAngle?: number }) => (
                  <Sector
                    cx={props.cx}
                    cy={props.cy}
                    innerRadius={props.innerRadius}
                    outerRadius={(props.outerRadius ?? 124) + 8}
                    startAngle={props.startAngle}
                    endAngle={props.endAngle}
                    fill={(props as { fill?: string }).fill || "rgba(201,162,39,0.92)"}
                    stroke="rgba(245,245,245,0.24)"
                    strokeWidth={1}
                    filter="url(#ringGlow)"
                  />
                )}
                onClick={(entry: SliceDatum) => onSelect?.(entry.id)}
              >
                {slices.map((slice, idx) => (
                  <Cell key={slice.id} fill={RING_COLORS[idx % RING_COLORS.length]} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                ))}
              </Pie>

              {selectedChildren.length ? (
                <Pie data={selectedChildren} dataKey="value" nameKey="label" innerRadius={58} outerRadius={78} paddingAngle={1}>
                  {selectedChildren.map((child, idx) => (
                    <Cell key={child.id} fill={childColor(idx)} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                  ))}
                </Pie>
              ) : null}

              <Tooltip content={<AllocationTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Center label */}
        <motion.div
          key={selected?.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none"
          }}
        >
          <div style={{ textAlign: "center", transform: "translateY(-2px)", maxWidth: 100 }}>
            <div className="qw-muted" style={{ fontSize: "0.62rem", whiteSpace: "nowrap" }}>
              {selected?.label ?? "Total"}
            </div>
            <PrivacyNumber value={selected?.value ?? total} format="currency" size="sm" />
          </div>
        </motion.div>
      </div>

      {/* --- Gold % bar --- */}
      <motion.div
        key={`bar-${selected?.id}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        style={{ marginTop: 8 }}
      >
        <div className="qw-row" style={{ marginBottom: 4 }}>
          <span className="qw-muted" style={{ fontSize: "0.72rem" }}>Peso global · {selected?.label ?? "Total"}</span>
          <span style={{ fontSize: "0.88rem", fontWeight: 700, color: tokens.gold }}>{selectedPct.toFixed(1)}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${selectedPct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              height: "100%",
              borderRadius: 999,
              background: "linear-gradient(90deg, rgba(201,162,39,0.6), rgba(201,162,39,0.95))",
              boxShadow: "0 0 12px rgba(201,162,39,0.4)"
            }}
          />
        </div>
      </motion.div>

      {/* --- Slice list --- */}
      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        {slices.map((slice, idx) => {
          const active = slice.id === selected?.id;
          return (
            <div
              key={slice.id}
              role="button"
              tabIndex={0}
              onClick={() => { onSelect?.(slice.id); setDrawerOpen(true); }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect?.(slice.id);
                  setDrawerOpen(true);
                }
              }}
              className="qw-row"
              style={{
                width: "100%",
                borderRadius: 12,
                border: active ? "1px solid rgba(201,162,39,0.55)" : "1px solid rgba(255,255,255,0.08)",
                padding: "8px 10px",
                background: active ? "rgba(201,162,39,0.08)" : "rgba(255,255,255,0.01)",
                cursor: "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: RING_COLORS[idx % RING_COLORS.length] }} />
                <span>{slice.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <PrivacyNumber value={slice.pct} format="percent" size="sm" />
                <PrivacyNumber value={slice.value} format="currency" size="sm" />
              </div>
            </div>
          );
        })}
      </div>

    </QuantumCard>

    <DetailDrawer
      open={drawerOpen}
      title="Radiografía interna"
      subtitle={selected?.label}
      onClose={() => setDrawerOpen(false)}
    >
      {topChildren.length ? (
        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          {topChildren.map((child, idx) => {
            const barWidth = Math.max(4, child.parentPct ?? 0);
            return (
              <div key={child.id} style={{ display: "grid", gap: 4 }}>
                <div className="qw-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: childColor(idx) }} />
                    <span className="qw-muted" style={{ fontSize: "0.82rem" }}>{child.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <PrivacyNumber value={child.pct} format="percent" size="sm" />
                    <PrivacyNumber value={child.parentPct ?? 0} format="percent" size="sm" />
                    <PrivacyNumber value={child.value} format="currency" size="sm" />
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                  <div style={{ width: `${barWidth}%`, height: "100%", background: childColor(idx) }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : <p className="qw-muted" style={{ fontSize: "0.78rem", marginTop: 8 }}>Sin desglose disponible.</p>}
    </DetailDrawer>
    </>
  );
}
