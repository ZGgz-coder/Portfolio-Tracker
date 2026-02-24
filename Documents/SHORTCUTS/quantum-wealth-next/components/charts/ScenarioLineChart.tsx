"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function ScenarioLineChart({ baseline, scenario }: { baseline: number[]; scenario: number[] }) {
  const data = baseline.map((value, idx) => ({ idx: idx + 1, baseline: value, scenario: scenario[idx] ?? value }));

  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="2 6" />
          <XAxis dataKey="idx" stroke="#777" tickLine={false} axisLine={false} />
          <YAxis stroke="#777" tickLine={false} axisLine={false} width={35} />
          <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
          <Line type="monotone" dataKey="baseline" stroke="#7d7d7d" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="scenario" stroke="#C9A227" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
