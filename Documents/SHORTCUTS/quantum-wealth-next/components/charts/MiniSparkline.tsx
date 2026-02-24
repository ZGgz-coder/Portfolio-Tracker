"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

export default function MiniSparkline({ data }: { data: number[] }) {
  const chartData = data.map((value, idx) => ({ idx, value }));
  return (
    <div style={{ width: "100%", height: 90 }}>
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 8, right: 6, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(201,162,39,0.45)" />
              <stop offset="100%" stopColor="rgba(201,162,39,0)" />
            </linearGradient>
          </defs>
          <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
          <Area type="monotone" dataKey="value" stroke="#C9A227" fill="url(#sparkFill)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
