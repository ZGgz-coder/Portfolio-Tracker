"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { tokens } from "@/styles/tokens";

type DockTab = {
  id: string;
  href: string;
  label: string;
  icon: React.ReactNode;
};

function IconPulse() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12h4l2.2-4.8L13 17l2.4-5H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLiquid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 12h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconAlpha() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 16l4-5 4 3 5-7 3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconFrontier() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconLog() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 4h9l3 3v13H6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 11h6M9 15h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconCopilot() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l2.3 5.7L20 11l-5.7 2.3L12 19l-2.3-5.7L4 11l5.7-2.3L12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

const TABS: DockTab[] = [
  { id: "pulse", href: "/pulse", label: "Pulso", icon: <IconPulse /> },
  { id: "liquid", href: "/liquid", label: "Liquidez", icon: <IconLiquid /> },
  { id: "alpha", href: "/alpha", label: "Alpha", icon: <IconAlpha /> },
  { id: "frontier", href: "/frontier", label: "Frontera", icon: <IconFrontier /> },
  { id: "log", href: "/log", label: "Bitácora", icon: <IconLog /> },
  { id: "copilot", href: "/copilot", label: "Copilot", icon: <IconCopilot /> }
];

export default function NeuralDock() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      window.requestAnimationFrame(() => {
        const nextY = window.scrollY;
        const delta = nextY - lastYRef.current;

        if (nextY < 24) {
          setHidden(false);
        } else if (delta > 8) {
          setHidden(true);
        } else if (delta < -8) {
          setHidden(false);
        }

        lastYRef.current = nextY;
        tickingRef.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Neural Dock"
      style={{
        position: "fixed",
        left: "50%",
        bottom: `max(10px, env(safe-area-inset-bottom, 0px))`,
        transform: `translateX(-50%) translateY(${hidden ? "130%" : "0"})`,
        transition: "transform 240ms ease, opacity 240ms ease",
        opacity: hidden ? 0.35 : 1,
        width: "min(470px, calc(100% - 24px))",
        padding: "8px",
        borderRadius: 999,
        border: "1px solid rgba(245,245,245,0.14)",
        background: tokens.glass,
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        display: "grid",
        gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
        gap: 6,
        zIndex: 40
      }}
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-label={tab.label}
            title={tab.label}
            style={{
              height: 42,
              display: "grid",
              placeItems: "center",
              borderRadius: 999,
              color: isActive ? tokens.textPrimary : tokens.textMuted,
              background: isActive ? "rgba(201,162,39,0.16)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${isActive ? "rgba(201,162,39,0.62)" : "rgba(245,245,245,0.08)"}`,
              boxShadow: isActive ? "0 0 0 1px rgba(201,162,39,0.2), 0 0 18px rgba(201,162,39,0.28)" : "none",
              transform: isActive ? "scale(1.05)" : "scale(1)",
              transition: "all 180ms ease"
            }}
          >
            {tab.icon}
          </Link>
        );
      })}
    </nav>
  );
}
