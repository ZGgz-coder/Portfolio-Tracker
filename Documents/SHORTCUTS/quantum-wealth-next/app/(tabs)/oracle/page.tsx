"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useRef } from "react";
import QuantumCard from "@/components/ui/QuantumCard";
import StateGate from "@/components/ui/StateGate";
import { fadeUp } from "@/lib/motion";
import { scenarioSeries, selectCopilotInsight, selectPulseCopilotState, selectPulseDrawdown, selectPulseLatest, selectPulseSeries, selectPulseVolatility } from "@/state/selectors";
import { useQuantumStore } from "@/state/store";
import { tokens } from "@/styles/tokens";

const baseline = [100, 101, 102, 103.4, 105, 106.1, 107.2, 109.4, 111.6, 114.2, 117.1, 120.4];

const PRESET_QUESTIONS = [
  "¿Cuánto he ganado este año?",
  "¿Debo rebalancear?",
  "¿Cuál es mi peor posición?",
  "¿Cuánto me queda de runway?"
];

interface ChatMessage {
  id: string;
  role: "user" | "oracle";
  text: string;
}

function generateOracleResponse(question: string, context: { netWorth: number; runwayMonths: number; worstSymbol: string; ytdPct: number }): string {
  const q = question.toLowerCase();
  if (q.includes("ganado") || q.includes("año")) {
    return `Desde enero has generado un +${context.ytdPct.toFixed(1)}% en tu cartera, equivalente a aproximadamente €${(context.netWorth * context.ytdPct / 100).toLocaleString("es-ES", { maximumFractionDigits: 0 })}. Tu mayor contribuidor es NVDA con +4.8% hoy.`;
  }
  if (q.includes("rebalancear")) {
    return `Sí. Cripto ha alcanzado el 42% de tu asignación tras el rally de BTC, superando tu objetivo del 35%. Te recomiendo recortar 2.5% rotando hacia cash o renta fija.`;
  }
  if (q.includes("peor") || q.includes("posición")) {
    return `Tu posición con peor rendimiento hoy es ${context.worstSymbol}. A largo plazo, revisa si sigue alineada con tu tesis de inversión o si es momento de tomar pérdidas fiscales.`;
  }
  if (q.includes("runway") || q.includes("queda")) {
    return `Tu liquidez actual cubre ${context.runwayMonths.toFixed(1)} meses de gastos. ${context.runwayMonths >= 6 ? "Estás en zona segura. Podrías considerar rotar el exceso hacia activos productivos." : "Estás por debajo del colchón recomendado de 6 meses. Prioriza construir reservas antes de nuevas inversiones."}`;
  }
  return `Analizando tu patrimonio de €${context.netWorth.toLocaleString("es-ES", { maximumFractionDigits: 0 })}... Esta es una consulta interesante. Mi recomendación es revisar la distribución sectorial y compararla con tu perfil de riesgo objetivo.`;
}

export default function OraclePage() {
  const screenState = useQuantumStore((s) => s.screenState);
  const insights = useQuantumStore((s) => s.insights);
  const scenarios = useQuantumStore((s) => s.scenarios);
  const activeScenarioId = useQuantumStore((s) => s.activeScenarioId);
  const updateActiveScenario = useQuantumStore((s) => s.updateActiveScenario);
  const pulseRange = useQuantumStore((s) => s.filters.pulseRange);
  const holdings = useQuantumStore((s) => s.holdings);
  const accounts = useQuantumStore((s) => s.accounts);
  const monthlyExpenses = useQuantumStore((s) => s.monthlyExpenses);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "oracle", text: "Soy tu Oráculo financiero. Pregúntame lo que quieras sobre tu patrimonio, inversiones o flujo de caja." }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const active = scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];
  const projected = useMemo(() => scenarioSeries(baseline, active), [active]);

  const series = useMemo(() => selectPulseSeries(pulseRange), [pulseRange]);
  const latest = useMemo(() => selectPulseLatest(series), [series]);
  const vol = useMemo(() => selectPulseVolatility(series), [series]);
  const dd = useMemo(() => selectPulseDrawdown(series), [series]);
  const copilotState = useMemo(() => selectPulseCopilotState(latest, vol, dd), [latest, vol, dd]);

  const topInsight = useMemo(() => selectCopilotInsight(insights), [insights]);

  const totalCash = useMemo(() => accounts.reduce((sum, a) => sum + a.balance, 0), [accounts]);
  const runwayMonths = monthlyExpenses > 0 ? totalCash / monthlyExpenses : 99;
  const netWorth = holdings.reduce((sum, h) => sum + h.value, totalCash);
  const worstSymbol = [...holdings].sort((a, b) => a.changePct - b.changePct)[0]?.symbol ?? "N/A";

  const stateConfig = {
    bull: { label: "Momento alcista", color: tokens.tealGlow, bg: tokens.tealFaint, border: tokens.tealBorder },
    correction: { label: "Corrección activa", color: tokens.coral, bg: tokens.coralFaint, border: tokens.coralBorder },
    volatile: { label: "Volatilidad elevada", color: tokens.amber, bg: tokens.amberFaint, border: tokens.amberBorder }
  }[copilotState];

  const digestBullets = useMemo(() => {
    const bullets = [
      `Patrimonio neto: €${netWorth.toLocaleString("es-ES", { maximumFractionDigits: 0 })}`,
      `Rentabilidad YTD: ${latest.deltaPct >= 0 ? "+" : ""}${latest.deltaPct.toFixed(2)}%`,
      `Volatilidad: ${vol.toFixed(2)}% — ${vol > 1 ? "Por encima del umbral" : "Controlada"}`,
      `Liquidez: ${runwayMonths.toFixed(1)} meses de runway`
    ];
    return bullets;
  }, [netWorth, latest, vol, runwayMonths]);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    setTimeout(() => {
      const response = generateOracleResponse(text, { netWorth, runwayMonths, worstSymbol, ytdPct: latest.deltaPct });
      setMessages((prev) => [...prev, { id: `o-${Date.now()}`, role: "oracle", text: response }]);
      setIsTyping(false);
    }, 900 + Math.random() * 600);
  }

  const severityColors = {
    high: { bg: tokens.coralFaint, border: tokens.coralBorder, dot: tokens.coral, label: "Urgente" },
    medium: { bg: tokens.amberFaint, border: tokens.amberBorder, dot: tokens.amber, label: "Importante" },
    low: { bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.12)", dot: "rgba(160,160,160,0.6)", label: "Info" }
  };

  const projectedEnd = projected[projected.length - 1];
  const baseEnd = baseline[baseline.length - 1];
  const scenarioDiff = projectedEnd - baseEnd;

  return (
    <StateGate state={screenState}>
      <section className="qw-screen">

        {/* Estado del mercado */}
        <motion.div {...fadeUp}>
          <QuantumCard disableGlow>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 10, height: 10, borderRadius: 999,
                background: stateConfig.color,
                boxShadow: `0 0 10px ${stateConfig.color}`
              }} />
              <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{stateConfig.label}</span>
              <span className="qw-muted" style={{ fontSize: "0.72rem", marginLeft: "auto" }}>Estado del mercado</span>
            </div>
            <div style={{
              marginTop: 8, padding: "6px 10px", borderRadius: 12,
              background: stateConfig.bg, border: `1px solid ${stateConfig.border}`
            }}>
              <span className="qw-muted" style={{ fontSize: "0.72rem" }}>
                {copilotState === "bull" && "Tendencia alcista confirmada. Momentum positivo en la cartera."}
                {copilotState === "correction" && "Corrección en curso. Vigilar niveles de soporte y liquidez."}
                {copilotState === "volatile" && "Volatilidad elevada. Considera reducir exposición a activos de riesgo."}
              </span>
            </div>
          </QuantumCard>
        </motion.div>

        {/* Alertas activas */}
        <motion.div {...fadeUp}>
          <QuantumCard title="Alertas activas">
            <div style={{ display: "grid", gap: 8 }}>
              {[...insights].sort((a, b) => {
                const score = { high: 3, medium: 2, low: 1 } as const;
                return score[b.severity] - score[a.severity];
              }).map((insight) => {
                const c = severityColors[insight.severity];
                return (
                  <div key={insight.id} style={{
                    padding: "10px 12px", borderRadius: 14,
                    background: c.bg, border: `1px solid ${c.border}`
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                      <div style={{ width: 7, height: 7, borderRadius: 999, background: c.dot, flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, fontSize: "0.84rem", flex: 1 }}>{insight.title}</span>
                      <span style={{ fontSize: "0.64rem", color: c.dot, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.label}</span>
                    </div>
                    <p className="qw-muted" style={{ margin: 0, fontSize: "0.74rem", lineHeight: 1.5 }}>{insight.body}</p>
                  </div>
                );
              })}
            </div>
          </QuantumCard>
        </motion.div>

        {/* Chat con el patrimonio */}
        <motion.div {...fadeUp}>
          <QuantumCard title="Habla con tu patrimonio">
            {/* Preguntas rápidas */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {PRESET_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendMessage(q)}
                  className="qw-pill"
                  style={{ fontSize: "0.74rem" }}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div style={{
              display: "flex", flexDirection: "column", gap: 8,
              maxHeight: 260, overflowY: "auto", paddingRight: 2,
              marginBottom: 10
            }}>
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      display: "flex",
                      justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
                    }}
                  >
                    <div style={{
                      maxWidth: "82%",
                      padding: "8px 12px",
                      borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      background: msg.role === "user"
                        ? "rgba(201,162,39,0.15)"
                        : "rgba(255,255,255,0.05)",
                      border: msg.role === "user"
                        ? "1px solid rgba(201,162,39,0.35)"
                        : "1px solid rgba(255,255,255,0.1)",
                      fontSize: "0.8rem",
                      lineHeight: 1.5,
                      color: tokens.textPrimary
                    }}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ display: "flex", gap: 4, padding: "8px 12px" }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        style={{ width: 6, height: 6, borderRadius: 999, background: tokens.gold }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input */}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendMessage(inputText); }}
                placeholder="Pregunta sobre tu patrimonio..."
                style={{
                  flex: 1, borderRadius: 12,
                  border: "1px solid rgba(245,245,245,0.14)",
                  background: "rgba(245,245,245,0.04)",
                  color: tokens.textPrimary,
                  padding: "9px 12px",
                  fontSize: "0.82rem"
                }}
              />
              <button
                type="button"
                onClick={() => sendMessage(inputText)}
                style={{
                  borderRadius: 12, border: "1px solid rgba(201,162,39,0.4)",
                  background: "rgba(201,162,39,0.12)", color: tokens.gold,
                  padding: "9px 14px", fontSize: "0.82rem", fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                →
              </button>
            </div>
          </QuantumCard>
        </motion.div>

        {/* Escenario activo */}
        <motion.div {...fadeUp}>
          <QuantumCard
            title="Escenario activo"
            rightSlot={<span className="qw-muted" style={{ fontSize: "0.72rem" }}>{active.name}</span>}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
              {[
                { label: "Compra/Venta", value: `€${active.buySellAmount.toLocaleString()}`, key: "buySellAmount", min: 0, max: 20000 },
                { label: "Cambio asign.", value: `${active.allocationShift > 0 ? "+" : ""}${active.allocationShift}%`, key: "allocationShift", min: -10, max: 20 },
                { label: "Horizonte", value: `${active.horizonMonths}m`, key: "horizonMonths", min: 3, max: 36 }
              ].map((item) => (
                <div key={item.key} style={{ padding: "8px 10px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="qw-muted" style={{ fontSize: "0.62rem", marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700 }}>{item.value}</div>
                  <input
                    type="range"
                    min={item.min}
                    max={item.max}
                    value={active[item.key as keyof typeof active] as number}
                    onChange={(e) => updateActiveScenario({ [item.key]: Number(e.target.value) })}
                    style={{ width: "100%", marginTop: 6, accentColor: tokens.gold }}
                  />
                </div>
              ))}
            </div>
            <div style={{
              padding: "8px 12px", borderRadius: 12,
              background: scenarioDiff >= 0 ? tokens.tealFaint : tokens.coralFaint,
              border: `1px solid ${scenarioDiff >= 0 ? tokens.tealBorder : tokens.coralBorder}`
            }}>
              <span className="qw-muted" style={{ fontSize: "0.72rem" }}>Proyección a {active.horizonMonths} meses: </span>
              <span style={{ fontWeight: 700, color: scenarioDiff >= 0 ? tokens.tealGlow : tokens.coral }}>
                {scenarioDiff >= 0 ? "+" : ""}{scenarioDiff.toFixed(2)} pts sobre base
              </span>
            </div>
          </QuantumCard>
        </motion.div>

        {/* Digest semanal */}
        <motion.div {...fadeUp}>
          <QuantumCard title="Digest semanal">
            <div style={{
              padding: "10px 12px", borderRadius: 14,
              background: "rgba(201,162,39,0.05)", border: "1px solid rgba(201,162,39,0.2)",
              marginBottom: 10
            }}>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: "0.88rem" }}>
                {topInsight.title}
              </div>
              <p className="qw-muted" style={{ margin: 0, fontSize: "0.74rem", lineHeight: 1.5 }}>
                {topInsight.body}
              </p>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {digestBullets.map((bullet, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 4, height: 4, borderRadius: 999, background: tokens.gold, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.78rem" }} className="qw-muted">{bullet}</span>
                </div>
              ))}
            </div>
          </QuantumCard>
        </motion.div>

      </section>
    </StateGate>
  );
}
