"use client";

export default function TopTabs({
  tabs,
  active,
  onChange
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`qw-pill ${active === tab.id ? "is-active" : ""}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
