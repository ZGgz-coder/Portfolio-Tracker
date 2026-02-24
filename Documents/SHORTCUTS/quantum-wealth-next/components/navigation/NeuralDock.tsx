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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12h4l2.2-4.8L13 17l2.4-5H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconFlow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 17c2-4 4-6 8-6s6 2 8-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 11c2-4 4-6 8-6s6 2 8-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconArena() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function IconFrontier() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l2.8 5.4H21l-5 4.6 1.9 6.5L12 16l-5.9 3.5L8 13 3 8.4h6.2L12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function IconOracle() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M16.9 16.9l1.4 1.4M18.4 5.6l-1.4 1.4M7.1 16.9l-1.4 1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconNexus() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="5" cy="18" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="19" cy="18" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7.2v4.8M12 12l-5 4M12 12l5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const TABS: DockTab[] = [
  { id: "pulse",    href: "/pulse",    label: "Pulso",    icon: <IconPulse />    },
  { id: "flow",     href: "/flow",     label: "Flujo",    icon: <IconFlow />     },
  { id: "arena",    href: "/arena",    label: "Bóveda",   icon: <IconArena />    },
  { id: "frontier", href: "/frontier", label: "Frontera", icon: <IconFrontier /> },
  { id: "oracle",   href: "/oracle",   label: "Oráculo",  icon: <IconOracle />   },
  { id: "nexus",    href: "/nexus",    label: "Nexo",     icon: <IconNexus />    }
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
        bottom: `calc(16px + env(safe-area-inset-bottom, 0px))`,
        transform: `translateX(-50%) translateY(${hidden ? "130%" : "0"})`,
        transition: "transform 240ms ease, opacity 240ms ease",
        opacity: hidden ? 0.35 : 1,
        width: "min(380px, calc(100% - 32px))",
        padding: "5px 6px",
        borderRadius: 22,
        border: "1px solid rgba(245,245,245,0.12)",
        background: tokens.glass,
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        display: "flex",
        justifyContent: "space-between",
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
              flex: "1 1 0",
              height: 44,
              display: "grid",
              placeItems: "center",
              borderRadius: 16,
              color: isActive ? tokens.textPrimary : tokens.textMuted,
              background: isActive ? "rgba(201,162,39,0.14)" : "transparent",
              border: isActive ? "1px solid rgba(201,162,39,0.5)" : "1px solid transparent",
              boxShadow: isActive ? "0 0 14px rgba(201,162,39,0.2)" : "none",
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
