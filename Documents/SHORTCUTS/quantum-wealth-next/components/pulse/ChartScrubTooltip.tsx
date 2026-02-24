import PrivacyNumber from "@/components/ui/PrivacyNumber";
import { tokens } from "@/styles/tokens";
import type { TimePoint } from "@/types/pulse";

export default function ChartScrubTooltip({ point }: { point: TimePoint | null }) {
  if (!point) return null;

  const dateLabel = new Date(point.t).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        left: 10,
        zIndex: 4,
        minWidth: 140,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: tokens.surface2,
        padding: "8px 10px"
      }}
    >
      <p className="qw-muted" style={{ margin: 0, fontSize: "0.72rem" }}>{dateLabel}</p>
      <PrivacyNumber value={point.v} format="currency" size="sm" />
    </div>
  );
}
