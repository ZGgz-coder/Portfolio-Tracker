import QuantumGlow from "@/components/ui/QuantumGlow";
import { tokens } from "@/styles/tokens";
import type { QuantumCardProps } from "@/types/ui";

export default function QuantumCard({ title, rightSlot, glowVariant = "gold", disableGlow, interactive, children }: QuantumCardProps) {
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        background: tokens.surface,
        borderRadius: tokens.radiusWidget,
        padding: 16,
        border: "1px solid rgba(245,245,245,0.08)",
        cursor: interactive ? "pointer" : "default"
      }}
    >
      {!disableGlow ? <QuantumGlow variant={glowVariant} /> : null}
      {title || rightSlot ? (
        <header className="qw-row" style={{ marginBottom: 10, position: "relative", zIndex: 1 }}>
          <h3 style={{ margin: 0, fontSize: "0.9rem" }}>{title}</h3>
          {rightSlot}
        </header>
      ) : null}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </section>
  );
}
