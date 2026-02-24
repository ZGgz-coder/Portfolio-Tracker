import { describe, expect, it } from "vitest";
import { selectPulseSeries } from "@/state/selectors";
import { useQuantumStore } from "@/state/store";

describe("pulse range store integration", () => {
  it("updates pulseRange and selector output length", () => {
    useQuantumStore.setState({ pulseRange: "1W", filters: { pulseRange: "1W" } });
    expect(useQuantumStore.getState().filters.pulseRange).toBe("1W");
    expect(selectPulseSeries(useQuantumStore.getState().filters.pulseRange)).toHaveLength(14);

    useQuantumStore.getState().setPulseRange("1M");
    expect(useQuantumStore.getState().filters.pulseRange).toBe("1M");
    expect(selectPulseSeries(useQuantumStore.getState().filters.pulseRange)).toHaveLength(30);
  });
});
