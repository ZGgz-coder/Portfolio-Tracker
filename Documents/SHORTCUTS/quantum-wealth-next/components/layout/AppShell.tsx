import SpatialBackground from "@/components/layout/SpatialBackground";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="qw-app-shell">
      <SpatialBackground />
      <div className="qw-layer-l1">
        <main className="qw-shell">{children}</main>
      </div>
    </div>
  );
}
