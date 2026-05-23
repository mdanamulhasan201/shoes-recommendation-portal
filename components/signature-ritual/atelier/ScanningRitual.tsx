import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBespokeOrder } from "@/components/signature-ritual/BespokeOrderContext";
import { syncKioskProfileForScantoolShell } from "@/components/signature-ritual/scantoolKioskProfileSync";
import {
  useScantoolFootScan,
  useScantoolSaveAfterScan,
} from "@/components/scantool/useScantoolScanDriver";

type Phase =
  | "left-prompt"
  | "left-scan"
  | "left-done"
  | "right-prompt"
  | "right-scan"
  | "right-done"
  | "final";

/** Scan screen palette — warm gold / ivory, tuned for kiosk legibility */
const SCAN = {
  eyebrow: "oklch(0.9 0.095 75)",
  title: "oklch(0.99 0.022 85)",
  titleShadow:
    "0 0 40px oklch(0.9 0.11 78 / 0.45), 0 2px 14px rgba(0,0,0,0.22)",
  cta: "oklch(0.93 0.11 78)",
  ctaBorder: "oklch(0.93 0.11 78 / 0.7)",
  hint: "oklch(0.84 0.035 75)",
  gradTop: "oklch(0.95 0.11 78)",
  gradBot: "oklch(0.8 0.095 72)",
  ellipse: "oklch(0.92 0.11 78 / 0.82)",
  fillComplete: "oklch(0.9 0.11 78 / 0.24)",
  ambient: "oklch(0.9 0.11 78 / 0.2)",
  labelIdle: "oklch(0.76 0.035 72)",
  labelActive: "oklch(0.92 0.095 75)",
} as const;

/** Softer edge darkening so copy and foot glow stay readable */
export function ScanningRitual({
  onComplete,
  onBack,
}: {
  onComplete: () => void;
  onBack?: () => void;
}) {
  const { order } = useBespokeOrder();
  const [phase, setPhase] = useState<Phase>("left-prompt");
  const [scannerError, setScannerError] = useState<string | null>(null);
  const { saveScan, isSaving } = useScantoolSaveAfterScan();

  useEffect(() => {
    syncKioskProfileForScantoolShell(order);
  }, [order]);

  const reportScanError = useCallback((message: string | null) => {
    setScannerError(message);
  }, []);

  const onFootScanFinished = useCallback((ok: boolean) => {
    setPhase((prev) => {
      if (prev === "left-scan") return ok ? "left-done" : "left-prompt";
      if (prev === "right-scan") return ok ? "right-done" : "right-prompt";
      return prev;
    });
  }, []);

  useScantoolFootScan({
    scanningPhase:
      phase === "left-scan" ? "left" : phase === "right-scan" ? "right" : null,
    reportError: reportScanError,
    onFinished: onFootScanFinished,
  });

  const goToFinalAfterSave = useCallback(async () => {
    setScannerError(null);
    const ok = await saveScan();
    if (!ok) {
      setScannerError(
        "Speichern/Hochladen fehlgeschlagen. Bitte erneut versuchen.",
      );
      return;
    }
    setPhase("final");
  }, [saveScan]);

  const copy: Record<
    Phase,
    { eyebrow: string; title: string; cta: string; onTap: () => void }
  > = useMemo(
    () => ({
      "left-prompt": {
        eyebrow: "Schritt 1 — Linker Fuß",
        title: "Platzieren Sie Ihren linken Fuß",
        cta: "Scan starten",
        onTap: () => setPhase("left-scan"),
      },
      "left-scan": {
        eyebrow: "Schritt 1 — Linker Fuß",
        title: "Ihre Form wird erfasst",
        cta: "",
        onTap: () => {},
      },
      "left-done": {
        eyebrow: "Schritt 1 — Abgeschlossen",
        title: "Linke Form, erfasst.",
        cta: "Weiter zum rechten Fuß",
        onTap: () => setPhase("right-prompt"),
      },
      "right-prompt": {
        eyebrow: "Schritt 2 — Rechter Fuß",
        title: "Platzieren Sie Ihren rechten Fuß",
        cta: "Scan starten",
        onTap: () => setPhase("right-scan"),
      },
      "right-scan": {
        eyebrow: "Schritt 2 — Rechter Fuß",
        title: "Ihre Form wird erfasst",
        cta: "",
        onTap: () => {},
      },
      "right-done": {
        eyebrow: "Schritt 2 — Abgeschlossen",
        title: "Rechte Form, erfasst.",
        cta: "Beide Formen ansehen",
        onTap: () => {
          void goToFinalAfterSave();
        },
      },
      final: {
        eyebrow: "Präzision",
        title: "Ihre Form. Präzise verstanden.",
        cta: "Modell auswählen",
        onTap: onComplete,
      },
    }),
    [goToFinalAfterSave, onComplete],
  );

  const current = copy[phase];

  const ctaLabel =
    phase === "right-done" && isSaving
      ? "Wird gespeichert …"
      : current.cta;

  const leftState: FootState = phase.startsWith("left")
    ? phase === "left-prompt"
      ? "prompt"
      : phase === "left-scan"
        ? "scanning"
        : "complete"
    : phase === "final" || phase.startsWith("right")
      ? "complete"
      : "idle";

  const rightState: FootState = phase.startsWith("right")
    ? phase === "right-prompt"
      ? "prompt"
      : phase === "right-scan"
        ? "scanning"
        : "complete"
    : phase === "final"
      ? "complete"
      : "idle";

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className="absolute inset-0 flex flex-col items-center justify-center"
    >
      {onBack ? (
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, delay: 0.35, ease: "easeOut" }}
          className="absolute left-4 top-5 z-40 md:left-8 md:top-9"
        >
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer rounded-full border border-ivory/28 bg-black/28 px-5 py-2.5 font-sans text-[0.62rem] font-medium uppercase tracking-[0.42em] text-[oklch(0.93_0.11_78)] shadow-[0_12px_40px_-8px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-300 hover:border-[oklch(0.93_0.11_78/0.55)] hover:bg-black/42 hover:text-[oklch(0.99_0.022_85)] hover:shadow-[0_16px_48px_-10px_oklch(0.9_0.11_78/0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.9_0.11_78/0.4)]"
          >
            Zurück
          </button>
        </motion.div>
      ) : null}

      {/* Top instruction */}
      <div className="absolute top-20 text-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 1 }}
          >
            <p className="tracking-whisper mb-4" style={{ color: SCAN.eyebrow }}>
              {current.eyebrow}
            </p>
            <p
              className="font-display text-4xl italic md:text-5xl"
              style={{ color: SCAN.title, textShadow: SCAN.titleShadow }}
            >
              {current.title}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Foot displays */}
      <div className="flex items-center justify-center gap-16 md:gap-32">
        <FootScan side="left" state={leftState} />
        <FootScan side="right" state={rightState} />
      </div>

      {/* Bottom CTA */}
      <div className="absolute bottom-20 flex flex-col items-center gap-4 text-center">
        {scannerError ? (
          <p className="max-w-sm px-4 text-center text-[0.7rem] font-sans leading-relaxed tracking-[0.08em] text-red-300/95">
            {scannerError}
          </p>
        ) : null}
        <AnimatePresence mode="wait">
          {current.cta && (
            <motion.button
              key={phase}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.8 }}
              disabled={phase === "right-done" && isSaving}
              onClick={current.onTap}
              className="group tracking-atelier transition-colors hover:opacity-95 disabled:pointer-events-none disabled:cursor-wait disabled:opacity-45"
              style={{ color: SCAN.cta }}
            >
              <span
                className="border-b pb-2 transition-colors group-hover:border-[oklch(0.97_0.018_85/0.55)]"
                style={{ borderColor: SCAN.ctaBorder }}
              >
                {ctaLabel}
              </span>
            </motion.button>
          )}
          {!current.cta && (
            <motion.p
              key={`${phase}-hint`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[0.65rem] uppercase tracking-[0.4em]"
              style={{ color: SCAN.hint }}
            >
              · einen Moment ·
            </motion.p>
          )}
        </AnimatePresence>
      </div>

    </motion.section>
  );
}

type FootState = "idle" | "prompt" | "scanning" | "complete";

function FootScan({ side, state }: { side: "left" | "right"; state: FootState }) {
  const flip = side === "right" ? "scale-x-[-1]" : "";

  return (
    <div className="relative">
      <motion.div
        animate={{ opacity: state === "idle" ? 0.5 : state === "prompt" ? 0.88 : 1 }}
        transition={{ duration: 1.5 }}
        className="relative h-72 w-40 md:h-[26rem] md:w-60"
      >
        {/* Glowing outline guide */}
        {state === "prompt" && (
          <motion.div
            animate={{ opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 2.4, repeat: Infinity }}
            className="absolute inset-0 rounded-[50%/40%]"
            style={{
              boxShadow: `0 0 90px oklch(0.92 0.11 78 / 0.65), inset 0 0 55px oklch(0.92 0.11 78 / 0.38)`,
              border: "1px solid oklch(0.92 0.11 78 / 0.78)",
            }}
          />
        )}

        {/* Ambient halo for scanning / complete */}
        {(state === "scanning" || state === "complete") && (
          <div
            className="pointer-events-none absolute -inset-6 -z-10"
            style={{
              background: `radial-gradient(ellipse at center, ${SCAN.ambient} 0%, transparent 70%)`,
            }}
          />
        )}

        {/* Foot SVG */}
        <svg viewBox="0 0 200 400" className={`relative h-full w-full ${flip}`} fill="none">
          <defs>
            <linearGradient id={`grad-${side}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SCAN.gradTop} stopOpacity="1" />
              <stop offset="100%" stopColor={SCAN.gradBot} stopOpacity="0.92" />
            </linearGradient>
          </defs>
          <motion.path
            d="M100 30 C 60 30, 50 80, 55 140 C 60 200, 50 260, 60 320 C 70 370, 130 370, 140 320 C 150 260, 140 200, 145 140 C 150 80, 140 30, 100 30 Z"
            stroke={`url(#grad-${side})`}
            strokeWidth="1.55"
            fill={state === "complete" ? SCAN.fillComplete : "transparent"}
            initial={{ pathLength: 0 }}
            animate={{
              pathLength: state === "idle" || state === "prompt" ? 0.4 : 1,
              opacity: state === "complete" ? 1 : 0.96,
            }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          {(state === "scanning" || state === "complete") &&
            [80, 130, 180, 230, 280, 330].map((y, i) => (
              <motion.ellipse
                key={y}
                cx="100"
                cy={y}
                rx={y < 60 ? 25 : y > 280 ? 38 : 45}
                ry="6"
                stroke={SCAN.ellipse}
                strokeWidth="0.85"
                fill="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
              />
            ))}
        </svg>

        {/* Light sweep during scan */}
        {state === "scanning" && (
          <motion.div
            initial={{ y: "-10%", opacity: 0 }}
            animate={{ y: "110%", opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-x-0 h-24"
            style={{
              background: `linear-gradient(180deg, transparent, oklch(0.94 0.11 78 / 0.82), transparent)`,
              filter: "blur(6px)",
            }}
          />
        )}
      </motion.div>

      <div
        className="mt-6 text-center text-[0.7rem] uppercase tracking-[0.45em] transition-colors duration-500"
        style={{
          color: state === "idle" ? SCAN.labelIdle : SCAN.labelActive,
          fontWeight: 400,
        }}
      >
        {side === "left" ? "Links" : "Rechts"}
      </div>
    </div>
  );
}
