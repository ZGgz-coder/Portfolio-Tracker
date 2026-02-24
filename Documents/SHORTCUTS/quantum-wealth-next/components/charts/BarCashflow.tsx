"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

export default function BarCashflow({ data }: { data: { label: string; value: number }[] }) {
  return (
    <div style={{ width: "100%", height: 170 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="label" stroke="#777" tickLine={false} axisLine={false} />
          <YAxis stroke="#777" tickLine={false} axisLine={false} width={35} />
          <Bar dataKey="value" fill="#C9A227" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
