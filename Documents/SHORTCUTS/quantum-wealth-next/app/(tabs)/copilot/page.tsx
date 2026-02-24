"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import ScenarioLineChart from "@/components/charts/ScenarioLineChart";
import QuantumCard from "@/components/ui/QuantumCard";
import StateGate from "@/components/ui/StateGate";
import { fadeUp } from "@/lib/motion";
import { scenarioSeries } from "@/state/selectors";
import { useQuantumStore } from "@/state/store";

const baseline = [100, 101, 102, 103.4, 105, 106.1, 107.2, 109.4, 111.6, 114.2, 117.1, 120.4];

export default function CopilotPage() {
  const scenarios = useQuantumStore((s) => s.scenarios);
  const activeScenarioId = useQuantumStore((s) => s.activeScenarioId);
  const updateActiveScenario = useQuantumStore((s) => s.updateActiveScenario);
  const saveScenario = useQuantumStore((s) => s.saveScenario);
  const duplicateScenario = useQuantumStore((s) => s.duplicateScenario);
  const setActiveScenario = useQuantumStore((s) => s.setActiveScenario);
  const screenState = useQuantumStore((s) => s.screenState);

  const active = scenarios.find((scenario) => scenario.id === activeScenarioId) || scenarios[0];
  const projected = useMemo(() => scenarioSeries(baseline, active), [active]);

  return (
    <StateGate state={screenState}>
      <section className="qw-screen">
        <motion.div {...fadeUp}>
          <QuantumCard title="Copiloto IA" rightSlot={<div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="qw-pill" onClick={() => saveScenario(`Escenario ${scenarios.length + 1}`)}>Guardar</button>
            <button type="button" className="qw-pill" onClick={duplicateScenario}>Duplicar</button>
          </div>}>
            <div className="qw-row">
              <p className="qw-kicker">Escenario</p>
              <select value={activeScenarioId} onChange={(e) => setActiveScenario(e.target.value)} style={{ background: "#111", color: "#f5f5f5", border: "1px solid #333", borderRadius: 10, padding: "6px 8px" }}>
                {scenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
                ))}
              </select>
            </div>
          </QuantumCard>
        </motion.div>

        <motion.div {...fadeUp}>
          <QuantumCard title="Ajustes">
            <label style={{ display: "grid", gap: 4 }}>
              Monto compra/venta
              <input type="range" min={0} max={20000} value={active.buySellAmount} onChange={(e) => updateActiveScenario({ buySellAmount: Number(e.target.value) })} />
            </label>
            <label style={{ display: "grid", gap: 4, marginTop: 10 }}>
              Cambio de asignación (%)
              <input type="range" min={-10} max={20} value={active.allocationShift} onChange={(e) => updateActiveScenario({ allocationShift: Number(e.target.value) })} />
            </label>
            <label style={{ display: "grid", gap: 4, marginTop: 10 }}>
              Horizonte temporal (meses)
              <input type="range" min={3} max={36} value={active.horizonMonths} onChange={(e) => updateActiveScenario({ horizonMonths: Number(e.target.value) })} />
            </label>
          </QuantumCard>
        </motion.div>

        <motion.div {...fadeUp}>
          <QuantumCard title="Proyección (Base vs Escenario)">
            <ScenarioLineChart baseline={baseline} scenario={projected} />
          </QuantumCard>
        </motion.div>

        <motion.div {...fadeUp}>
          <QuantumCard title="Narrativa IA">
            <p>
              Si el cambio de asignación propuesto se mantiene durante {active.horizonMonths} meses, la trayectoria del escenario queda {projected[projected.length - 1] > baseline[baseline.length - 1] ? "por encima" : "por debajo"} de la base en aproximadamente {(projected[projected.length - 1] - baseline[baseline.length - 1]).toFixed(2)} puntos.
            </p>
          </QuantumCard>
        </motion.div>
      </section>
    </StateGate>
  );
}
