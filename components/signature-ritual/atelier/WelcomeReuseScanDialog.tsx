"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type WelcomeReuseScanDialogProps = {
  scanDateLabel: string;
  scanId: string | number;
  onUseExisting: () => void;
  onScanNew: () => void;
};

/**
 * Prior-scan prompt for the signature-ritual welcome flow (kiosk parity).
 * Styling uses the atelier palette: gold / ivory on deep obsidian.
 */
export function WelcomeReuseScanDialog({
  scanDateLabel,
  scanId,
  onUseExisting,
  onScanNew,
}: WelcomeReuseScanDialogProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-120 flex items-center justify-center bg-black/72 px-4 backdrop-blur-md"
      aria-hidden={false}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-reuse-scan-title"
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{
          opacity: visible ? 1 : 0,
          y: visible ? 0 : 18,
          scale: visible ? 1 : 0.98,
        }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto flex w-full max-w-[640px] flex-col items-center rounded-3xl border border-gold/28 bg-[linear-gradient(165deg,oklch(0.14_0.01_60/0.97),oklch(0.06_0.004_60/0.98))] px-6 py-10 text-center shadow-[0_32px_90px_-24px_rgb(0,0,0,0.75),inset_0_1px_0_oklch(0.92_0.01_85/0.06)] sm:px-10 sm:py-12"
      >
        <span className="block text-center font-sans text-[0.65rem] font-medium uppercase tracking-[0.38em] text-ivory/55">
          Vorherige Scandaten gefunden
        </span>

        <h2
          id="welcome-reuse-scan-title"
          className="font-serif mt-4 text-center text-2xl italic leading-tight text-ivory sm:text-3xl md:text-[clamp(1.5rem,4vw,2.35rem)]"
          style={{
            textShadow: "0 2px 28px oklch(0.02 0.002 60 / 0.9)",
          }}
        >
          Möchten Sie die vorherige Messung verwenden?
        </h2>

        <div className="mx-auto mt-7 flex w-full max-w-[440px] flex-col items-center justify-center gap-2 self-center rounded-2xl border border-gold/24 bg-black/40 px-5 py-5 text-center">
          <span className="block w-full font-sans text-[0.68rem] font-semibold uppercase tracking-[0.35em] text-gold/90">
            Letzter Scan
          </span>
          <span className="block w-full font-serif text-xl font-medium italic text-ivory sm:text-2xl">
            {scanDateLabel || "Datum unbekannt"}
          </span>
          <span className="block w-full break-all font-mono text-[0.72rem] tracking-wide text-ivory/45 sm:break-normal">
            ID #{String(scanId)}
          </span>
        </div>

        <p className="mx-auto mt-6 max-w-[480px] text-center text-sm leading-relaxed text-ivory/70 sm:text-[0.95rem]">
          Wir empfehlen, die vorhandenen Daten zu nutzen, wenn sich Ihre Füße seit dem letzten
          Scan nicht geändert haben.
        </p>

        <div className="mx-auto mt-9 flex w-full max-w-[480px] flex-col items-stretch gap-3 sm:flex-row sm:gap-4">
          <button
            type="button"
            onClick={onUseExisting}
            className="cursor-pointer rounded-full border-none px-6 py-3.5 font-sans text-[0.72rem] font-bold uppercase tracking-[0.22em] text-obsidian transition-transform duration-200 hover:scale-[1.02] sm:flex-1 sm:py-4"
            style={{
              background:
                "linear-gradient(160deg, oklch(0.82 0.09 75) 0%, oklch(0.74 0.09 75) 45%, oklch(0.62 0.07 70) 100%)",
              boxShadow:
                "0 0 32px oklch(0.78 0.09 75 / 0.35), 0 12px 36px -12px oklch(0.05 0 0 / 0.6)",
            }}
          >
            Vorherige verwenden
          </button>
          <button
            type="button"
            onClick={onScanNew}
            className="cursor-pointer rounded-full border-2 border-ivory/35 bg-transparent px-6 py-3.5 font-sans text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-ivory transition-colors duration-200 hover:border-gold/55 hover:text-gold/95 sm:flex-1 sm:py-4"
          >
            Neu scannen
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
