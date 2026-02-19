import SpatialBackground from "@/components/layout/SpatialBackground";
import NeuralDock from "@/components/navigation/NeuralDock";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="qw-app-shell">
      <SpatialBackground />
      <div className="qw-layer-l1">
        <main className="qw-shell">{children}</main>
      </div>
      <div className="qw-layer-l3">
        <NeuralDock />
      </div>
    </div>
  );
}
