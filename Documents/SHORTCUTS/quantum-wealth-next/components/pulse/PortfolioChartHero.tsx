"use client";

import { motion } from "framer-motion";
import { Area, ComposedChart, DotProps, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PrivacyNumber from "@/components/ui/PrivacyNumber";
import RangeChips from "@/components/pulse/RangeChips";
import ChartScrubTooltip from "@/components/pulse/ChartScrubTooltip";
import { useQuantumStore } from "@/state/store";
import { tokens } from "@/styles/tokens";
import type { RangeKey, TimePoint } from "@/types/pulse";

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

function EndGlowDot(props: DotProps & { isLast?: boolean }) {
  const { cx, cy, isLast } = props;
  if (!isLast || cx == null || cy == null) return null;

  return (
    <g>
      <circle cx={cx} cy={cy} r={11} fill="rgba(201,162,39,0.15)" />
      <circle cx={cx} cy={cy} r={5} fill="#C9A227" stroke="rgba(255,255,255,0.85)" strokeWidth={1.5} />
    </g>
  );
}

export default function PortfolioChartHero({
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
  const setPulseScrub = useQuantumStore((s) => s.setPulseScrub);
  const pulseScrub = useQuantumStore((s) => s.ui.pulseScrub);

  const scrubIndex = pulseScrub.index ?? series.length - 1;
  const scrubPoint = pulseScrub.active ? series[scrubIndex] : series[series.length - 1] || null;

  const handleTouchScrub = (clientX: number, container: HTMLElement) => {
    const rect = container.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const idx = Math.round(ratio * (series.length - 1));
    setPulseScrub(true, idx);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: tokens.bg,
        borderRadius: tokens.radiusWidget,
        border: "1px solid rgba(245,245,245,0.08)",
        padding: 14,
        minHeight: 350,
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div className="qw-row" style={{ alignItems: "flex-start" }}>
        <div>
          <p className="qw-kicker">Patrimonio total · {range}</p>
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
          <button type="button" className="qw-pill" onClick={onAddConnector} aria-label="Agregar conector">＋</button>
        </div>
      </div>

      <div
        style={{ width: "100%", height: 220, marginTop: 10, position: "relative", touchAction: "none" }}
        onTouchStart={(event) => handleTouchScrub(event.touches[0].clientX, event.currentTarget)}
        onTouchMove={(event) => handleTouchScrub(event.touches[0].clientX, event.currentTarget)}
        onTouchEnd={() => setPulseScrub(false, null)}
      >
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          <ChartScrubTooltip point={scrubPoint} />
        </motion.div>
        <ResponsiveContainer>
          <ComposedChart
            data={series}
            onMouseMove={(state) => {
              if (state?.activeTooltipIndex == null) return;
              setPulseScrub(true, Number(state.activeTooltipIndex));
            }}
            onMouseLeave={() => setPulseScrub(false, null)}
            margin={{ top: 10, right: 6, left: 0, bottom: 6 }}
          >
            <defs>
              <linearGradient id="pulseArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={tokens.goldSoft} />
                <stop offset="100%" stopColor={tokens.goldFaint} />
              </linearGradient>
            </defs>
            <XAxis dataKey="t" hide />
            <YAxis hide domain={["dataMin - 1000", "dataMax + 1000"]} />
            <Tooltip content={() => null} />
            <Area type="monotone" dataKey="v" stroke="none" fill="url(#pulseArea)" />
            <Line
              type="monotone"
              dataKey="v"
              stroke={tokens.gold}
              strokeWidth={2.6}
              dot={(props) => <EndGlowDot {...props} isLast={props.index === series.length - 1} />}
              activeDot={{ r: 6, fill: tokens.gold, stroke: "#fff", strokeWidth: 1.2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 8 }}>
        <RangeChips range={range} onChange={onRangeChange} />
      </div>
    </motion.section>
  );
}
