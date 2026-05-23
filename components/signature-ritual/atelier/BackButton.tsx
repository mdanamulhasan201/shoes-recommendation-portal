"use client";

import { motion } from "framer-motion";

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1.2, delay: 0.35, ease: "easeOut" }}
      className="fixed left-4 z-50 md:left-8"
      style={{ top: "max(1.25rem, env(safe-area-inset-top))" }}
    >
      <button
        type="button"
        onClick={onClick}
        className="cursor-pointer rounded-full border border-ivory/28 bg-black/28 px-5 py-2.5 font-sans text-[0.62rem] font-medium uppercase tracking-[0.42em] text-[oklch(0.93_0.11_78)] shadow-[0_12px_40px_-8px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-300 hover:border-[oklch(0.93_0.11_78/0.55)] hover:bg-black/42 hover:text-[oklch(0.99_0.022_85)] hover:shadow-[0_16px_48px_-10px_oklch(0.9_0.11_78/0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.9_0.11_78/0.4)]"
      >
        Zurück
      </button>
    </motion.div>
  );
}
