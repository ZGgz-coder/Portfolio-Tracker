"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

export default function DetailDrawer({
  open,
  title,
  subtitle,
  onClose,
  children
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const content = (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, border: 0, background: "rgba(0,0,0,0.45)", zIndex: 50 }}
          />
          <motion.aside
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.26, ease: [0.2, 0.7, 0.2, 1] }}
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              background: "#1A1A1A",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderTop: "1px solid rgba(245,245,245,0.1)",
              padding: "16px 16px calc(16px + env(safe-area-inset-bottom,0px))",
              zIndex: 51,
              maxHeight: "72vh",
              overflowY: "auto"
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.18)", margin: "0 auto 14px" }} />
            <h3 style={{ margin: 0 }}>{title}</h3>
            {subtitle ? <p className="qw-muted" style={{ marginBottom: 0 }}>{subtitle}</p> : null}
            {children}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
