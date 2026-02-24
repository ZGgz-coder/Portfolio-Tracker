"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatPercent, maskLike } from "@/lib/format";
import { useQuantumStore } from "@/state/store";
import type { PrivacyNumberProps } from "@/types/ui";

export default function PrivacyNumber({ value, format, defaultHidden = false, size = "md" }: PrivacyNumberProps) {
  const privacyMode = useQuantumStore((state) => state.privacyMode);
  const [hidden, setHidden] = useState(defaultHidden || privacyMode);

  useEffect(() => {
    setHidden(defaultHidden || privacyMode);
  }, [defaultHidden, privacyMode]);

  const text = useMemo(() => {
    if (typeof value === "string") return value;
    if (format === "currency") return formatCurrency(value);
    if (format === "percent") return formatPercent(value);
    return String(value);
  }, [value, format]);

  const fontSize = size === "lg" ? "2rem" : size === "sm" ? "0.9rem" : "1.2rem";

  return (
    <button
      type="button"
      onClick={() => setHidden((prev) => !prev)}
      style={{
        border: 0,
        background: "transparent",
        color: "inherit",
        padding: 0,
        minWidth: "8ch",
        textAlign: "left",
        fontSize,
        fontWeight: 700
      }}
      aria-label="Alternar privacidad"
    >
      <AnimatePresence mode="wait" initial={false}>
        {hidden ? (
          <motion.span
            key="masked"
            initial={{ opacity: 0.4, filter: "blur(2px)" }}
            animate={{ opacity: 0.85, filter: "blur(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {maskLike(text)}
          </motion.span>
        ) : (
          <motion.span
            key="clear"
            initial={{ opacity: 0.4, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
