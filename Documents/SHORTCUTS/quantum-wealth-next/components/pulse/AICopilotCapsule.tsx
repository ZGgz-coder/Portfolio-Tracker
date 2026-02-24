"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import QuantumCard from "@/components/ui/QuantumCard";

const COPY = {
  bull: {
    headline: "Momentum positivo sostenido en el último rango seleccionado.",
    bullets: [
      "El crecimiento ha sido impulsado principalmente por tu exposición en tecnología.",
      "La volatilidad se mantiene contenida respecto a la media del período.",
      "Tu asignación actual favorece continuidad de tendencia."
    ]
  },
  correction: {
    headline: "Ajuste técnico dentro de una estructura aún saludable.",
    bullets: [
      "La caída reciente proviene de activos de mayor beta.",
      "Tu diversificación ha amortiguado parte del retroceso.",
      "No se observan anomalías estructurales en el portafolio."
    ]
  },
  volatile: {
    headline: "Incremento de volatilidad detectado en el rango actual.",
    bullets: [
      "Oscilaciones superiores al promedio de las últimas semanas.",
      "Mayor sensibilidad en cripto y growth stocks.",
      "Considera revisar escenarios en Copilot."
    ]
  }
} as const;

export default function AICopilotCapsule({
  state,
  updatedAt,
  onOpenCopilot,
  onExplain,
  onDrivers
}: {
  state: "bull" | "correction" | "volatile";
  updatedAt: string;
  onOpenCopilot: () => void;
  onExplain: () => void;
  onDrivers: () => void;
}) {
  const block = COPY[state];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
      <QuantumCard title="Quantum Copilot" rightSlot={<span className="qw-muted">Updated {updatedAt}</span>}>
        <div className="qw-subtle-shimmer" style={{ borderRadius: 12, paddingTop: 2 }}>
          <div className="qw-row" style={{ justifyContent: "flex-start", gap: 8, marginBottom: 8 }}>
            <span aria-hidden="true" style={{ width: 18, height: 18, borderRadius: 999, display: "inline-grid", placeItems: "center", border: "1px solid rgba(201,162,39,0.45)", fontSize: "0.72rem" }}>
              ✦
            </span>
            <strong>{block.headline}</strong>
          </div>

          <ul style={{ margin: 0, paddingLeft: 16, display: "grid", gap: 6 }}>
            {block.bullets.map((bullet) => (
              <li key={bullet} className="qw-muted" style={{ fontSize: "0.88rem" }}>{bullet}</li>
            ))}
          </ul>

          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <button type="button" className="qw-pill" onClick={onExplain}>Explain</button>
            <button type="button" className="qw-pill" onClick={onDrivers}>Drivers</button>
            <Link href="/copilot" className="qw-pill" onClick={onOpenCopilot}>Open Copilot</Link>
          </div>
        </div>
      </QuantumCard>
    </motion.div>
  );
}
