"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tokens } from "@/styles/tokens";

const tabs = [
  { id: "pulse", label: "Pulso", hint: "Resumen", glyph: "◉", href: "/pulse" },
  { id: "liquid", label: "Liquidez", hint: "Bancos", glyph: "◌", href: "/liquid" },
  { id: "alpha", label: "Alpha", hint: "Acciones", glyph: "△", href: "/alpha" },
  { id: "frontier", label: "Frontera", hint: "Cripto", glyph: "◇", href: "/frontier" },
  { id: "log", label: "Bitácora", hint: "Flujos", glyph: "▤", href: "/log" },
  { id: "copilot", label: "Copilot", hint: "IA", glyph: "✦", href: "/copilot" }
];

export default function BottomTabNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Pestañas principales"
      style={{
        position: "fixed",
        bottom: `max(10px, env(safe-area-inset-bottom, 0px))`,
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(560px, calc(100% - 18px))",
        padding: 8,
        background: "rgba(10,10,10,0.9)",
        border: "1px solid rgba(245,245,245,0.11)",
        borderRadius: 20,
        display: "flex",
        gap: 8,
        overflowX: "auto",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
        zIndex: 15
      }}
      className="qw-tab-scroll"
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const isCopilot = tab.id === "copilot";
        return (
          <Link
            key={tab.id}
            href={tab.href}
            style={{
              flex: "0 0 auto",
              minWidth: 86,
              textAlign: "left",
              padding: "8px 10px",
              borderRadius: 14,
              border: `1px solid ${active ? "rgba(201,162,39,0.72)" : "rgba(245,245,245,0.1)"}`,
              background: active ? "linear-gradient(135deg, rgba(201,162,39,0.2), rgba(201,162,39,0.08))" : "rgba(255,255,255,0.02)",
              color: isCopilot ? "#f3df99" : active ? tokens.textPrimary : tokens.textMuted,
              scrollSnapAlign: "center",
              display: "grid",
              gap: 2
            }}
          >
            <span style={{ fontSize: "0.62rem", letterSpacing: "0.04em", opacity: active ? 1 : 0.7 }}>
              {tab.glyph} {tab.hint}
            </span>
            <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
