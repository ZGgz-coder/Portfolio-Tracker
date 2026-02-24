import type { UIState } from "@/types/domain";

export default function StateGate({ state, children }: { state: UIState; children: React.ReactNode }) {
  if (state === "loading") return <p className="qw-muted">Cargando datos...</p>;
  if (state === "empty") return <p className="qw-muted">Aún no hay datos conectados.</p>;
  if (state === "error") return <p className="qw-muted">Error de conexión. Usando caché local.</p>;
  return <>{children}</>;
}
