import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PrivacyNumber from "@/components/ui/PrivacyNumber";
import { useQuantumStore } from "@/state/store";

describe("PrivacyNumber", () => {
  it("renders masked when global privacy mode is on", () => {
    useQuantumStore.setState({ privacyMode: true });
    render(<PrivacyNumber value={12345} format="currency" />);
    expect(screen.getByRole("button")).toHaveTextContent("•••••");
  });

  it("toggles from visible to masked on tap", async () => {
    useQuantumStore.setState({ privacyMode: false });
    render(<PrivacyNumber value={12345} format="plain" defaultHidden={false} />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveTextContent("12345");
    fireEvent.click(btn);
    await waitFor(() => expect(btn).toHaveTextContent("•••••"));
  });

  it("respects global toggle both directions", async () => {
    useQuantumStore.setState({ privacyMode: true });
    render(<PrivacyNumber value={6789} format="plain" defaultHidden={false} />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveTextContent("•••••");

    act(() => {
      useQuantumStore.setState({ privacyMode: false });
    });
    await waitFor(() => expect(btn).toHaveTextContent("6789"));
  });
});
