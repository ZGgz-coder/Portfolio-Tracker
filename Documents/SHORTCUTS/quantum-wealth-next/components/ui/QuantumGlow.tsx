import { tokens } from "@/styles/tokens";

export default function QuantumGlow({ variant = "gold" }: { variant?: "gold" }) {
  const color = variant === "gold" ? tokens.gold : tokens.gold;
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        width: 160,
        height: 160,
        right: -40,
        top: -45,
        borderRadius: 999,
        pointerEvents: "none",
        background: `radial-gradient(circle, ${color}33 0%, transparent 72%)`,
        filter: "blur(8px)",
        opacity: 0.6
      }}
    />
  );
}
