"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import SpatialBackground from "@/components/layout/SpatialBackground";
import NeuralDock from "@/components/navigation/NeuralDock";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="qw-app-shell">
      <SpatialBackground />

      <div className="qw-layer-l1">
        <main className="qw-shell">
          <AnimatePresence mode="wait" initial={false}>
            <motion.section
              key={pathname}
              className="qw-route-layer"
              initial={{ opacity: 0, scale: 0.98, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -6 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {children}
            </motion.section>
          </AnimatePresence>
        </main>
      </div>

      <div className="qw-layer-l3">
        <NeuralDock />
      </div>
    </div>
  );
}
