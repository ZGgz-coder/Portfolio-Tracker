import { tokens } from "@/styles/tokens";
import type { SourceBadgeProps } from "@/types/ui";

const LABELS = {
  bank: "Banco",
  broker: "Corredor",
  exchange: "Casa de cambio",
  wallet: "Cartera",
  defi: "DeFi"
} as const;

export default function SourceBadge({ type }: SourceBadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 8px",
        borderRadius: tokens.radiusChip,
        border: "1px solid rgba(245,245,245,0.15)",
        color: "#a0a0a0",
        fontSize: "0.72rem"
      }}
    >
      <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 999, background: "rgba(201,162,39,0.75)" }} />
      {LABELS[type]}
    </span>
  );
}
