"use client";

import { useMemo, useState } from "react";
import AICopilotCapsule from "@/components/pulse/AICopilotCapsule";
import AllocationImpactRing from "@/components/pulse/AllocationImpactRing";
import StateGate from "@/components/ui/StateGate";
import {
  selectAllocationTreemap,
  selectPulseCopilotState,
  selectPulseDrawdown,
  selectPulseLatest,
  selectPulseSeries,
  selectPulseVolatility
} from "@/state/selectors";
import { useQuantumStore } from "@/state/store";

export default function PulsePage() {
  const screenState = useQuantumStore((s) => s.screenState);
  const privacyMode = useQuantumStore((s) => s.privacyMode);
  const togglePrivacyMode = useQuantumStore((s) => s.togglePrivacyMode);
  const pulseRange = useQuantumStore((s) => s.filters.pulseRange);
  const setPulseRange = useQuantumStore((s) => s.setPulseRange);

  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();

  const series = useMemo(() => selectPulseSeries(pulseRange), [pulseRange]);
  const allocation = useMemo(() => selectAllocationTreemap(), []);
  const latest = useMemo(() => selectPulseLatest(series), [series]);
  const volatility = useMemo(() => selectPulseVolatility(series), [series]);
  const drawdown = useMemo(() => selectPulseDrawdown(series), [series]);
  const copilotState = useMemo(() => selectPulseCopilotState(latest, volatility, drawdown), [latest, volatility, drawdown]);

  const updatedAt = "2 min ago";

  return (
    <StateGate state={screenState}>
      <section className="qw-screen">
        <AllocationImpactRing
          data={allocation}
          selectedId={selectedNodeId}
          onSelect={setSelectedNodeId}
          series={series}
          range={pulseRange}
          onRangeChange={setPulseRange}
          value={latest.value}
          deltaAbs={latest.deltaAbs}
          deltaPct={latest.deltaPct}
          privacyMode={privacyMode}
          onTogglePrivacy={togglePrivacyMode}
          onAddConnector={() => console.log("add connector")}
        />

        <AICopilotCapsule
          state={copilotState}
          updatedAt={updatedAt}
          onExplain={() => console.log("explain")}
          onDrivers={() => console.log("drivers")}
          onOpenCopilot={() => console.log("open copilot")}
        />
      </section>
    </StateGate>
  );
}
