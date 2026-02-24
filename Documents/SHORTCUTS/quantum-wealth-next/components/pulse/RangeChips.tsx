"use client";

import type { RangeKey } from "@/types/pulse";

const ranges: RangeKey[] = ["1D", "1W", "1M", "3M", "YTD", "1Y", "ALL"];

export default function RangeChips({ range, onChange }: { range: RangeKey; onChange: (range: RangeKey) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
      {ranges.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`qw-pill ${range === item ? "is-active" : ""}`}
          style={{
            borderColor: range === item ? "rgba(201,162,39,0.75)" : "rgba(245,245,245,0.14)",
            boxShadow: range === item ? "0 0 0 1px rgba(201,162,39,0.1), inset 0 0 0 1px rgba(201,162,39,0.25)" : "none"
          }}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
