"use client";

import { motion } from "framer-motion";
import { BackButton } from "@/components/signature-ritual/atelier/BackButton";

/** Silhouette notice — readable copy, premium gold / ivory */
const SILHOUETTE = {
  eyebrow: "oklch(0.9 0.095 75)",
  body: "oklch(0.99 0.022 85)",
  bodyShadow:
    "0 0 40px oklch(0.9 0.11 78 / 0.38), 0 2px 16px rgba(0,0,0,0.22)",
  divider: "oklch(0.92 0.11 78 / 0.55)",
  cta: "oklch(0.93 0.11 78)",
  ctaBorder: "oklch(0.93 0.11 78 / 0.65)",
  ambient: "oklch(0.9 0.11 78 / 0.14)",
} as const;

export function SilhouetteNotice({
  onContinue,
  onBack,
}: {
  onContinue: () => void;
  onBack?: () => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.4 }}
      className="absolute inset-0 flex flex-col items-center justify-center px-6 md:px-10"
    >
      {onBack ? <BackButton onClick={onBack} /> : null}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.4 }}
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 55% at 50% 42%, ${SILHOUETTE.ambient} 0%, transparent 68%)`,
        }}
      />

      <div className="relative z-20 max-w-2xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.2 }}
          className="text-[0.65rem] tracking-[0.5em] md:text-[0.7rem]"
          style={{ color: SILHOUETTE.eyebrow, fontWeight: 300 }}
        >
          DIE SILHOUETTE
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.6, delay: 0.45 }}
          className="font-display mx-auto mt-10 max-w-xl text-3xl italic leading-[1.45] md:text-4xl"
          style={{
            color: SILHOUETTE.body,
            fontWeight: 300,
            textShadow: SILHOUETTE.bodyShadow,
          }}
        >
          Für dieses Modell wurde bewusst eine einzige, perfekt ausbalancierte
          Silhouette definiert.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1.4, delay: 0.85 }}
          className="mx-auto mt-12 h-px w-24 origin-center"
          style={{ background: SILHOUETTE.divider }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 1.2 }}
        className="absolute bottom-14 left-1/2 z-20 -translate-x-1/2 md:bottom-16"
      >
        <button
          type="button"
          onClick={onContinue}
          className="group text-[0.7rem] tracking-[0.55em] transition-opacity hover:opacity-95"
          style={{ color: SILHOUETTE.cta, fontWeight: 300 }}
        >
          <span
            className="border-b pb-2 transition-colors group-hover:border-[oklch(0.99_0.022_85/0.55)]"
            style={{ borderColor: SILHOUETTE.ctaBorder }}
          >
            FORTFAHREN
          </span>
        </button>
      </motion.div>
    </motion.section>
  );
}
