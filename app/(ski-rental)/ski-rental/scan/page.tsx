"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Nav } from "@/ski-rental/components/Nav";
import { Particles } from "@/ski-rental/components/Particles";

const PHASES = [
  { k: "ALIGN", t: "Calibrating spatial sensors", sub: "lidar · stereoscopic · pressure grid" },
  { k: "CAPTURE", t: "Scanning foot geometry", sub: "47 anatomical landmarks · 0.1mm precision" },
  { k: "ANALYSE", t: "Modelling biomechanical signature", sub: "arch · pronation · pressure map" },
  { k: "SYNTHESISE", t: "Composing your fit profile", sub: "12.4M comparative profiles" },
];

const METRICS = [
  { l: "ARCH HEIGHT", v: "MEDIUM-HIGH", n: 72 },
  { l: "FOOT WIDTH", v: "EU 102 mm", n: 64 },
  { l: "PRONATION", v: "NEUTRAL", n: 50 },
  { l: "PRESSURE BIAS", v: "FOREFOOT 58%", n: 58 },
  { l: "ANKLE FLEX", v: "18.4°", n: 81 },
  { l: "ASYMMETRY", v: "L 2.1% / R", n: 12 },
];

export default function Scan() {
  const router = useRouter();
  const [phase, setPhase] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (phase >= PHASES.length) {
      setDone(true);
      return;
    }
    const t = setTimeout(() => setPhase(phase + 1), 1700);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <Nav />
      <div className="absolute inset-0 bg-grid opacity-30" />
      <Particles density={70} />
      <div className="absolute inset-x-0 top-0 h-[55vh] bg-[radial-gradient(circle_at_50%_20%,oklch(0.78_0.16_165/0.18),transparent_70%)]" />

      <section className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-12 px-6 pt-28 pb-16 lg:grid-cols-[1.2fr_1fr]">
        {/* LEFT — scan visual */}
        <div className="relative flex items-center justify-center">
          <div className="relative h-[560px] w-[420px]">
            {/* concentric rings */}
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 rounded-full border border-primary/20"
                style={{
                  width: 220 + i * 70,
                  height: 220 + i * 70,
                  marginLeft: -(110 + i * 35),
                  marginTop: -(110 + i * 35),
                }}
                animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                transition={{ duration: 24 + i * 6, repeat: Infinity, ease: "linear" }}
              />
            ))}

            {/* foot silhouette */}
            <svg viewBox="0 0 200 400" className="absolute inset-0 mx-auto h-full w-auto">
              <defs>
                <linearGradient id="footGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.78 0.16 165)" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="oklch(0.85 0.12 200)" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              <path
                d="M100 30 C70 30 55 70 58 130 C60 180 50 230 55 290 C58 340 75 380 100 380 C125 380 142 340 145 290 C150 230 140 180 142 130 C145 70 130 30 100 30 Z"
                fill="none"
                stroke="url(#footGrad)"
                strokeWidth="1.2"
                strokeDasharray="2 4"
              />
              {/* landmark dots */}
              {[
                [100, 60],
                [85, 110],
                [115, 110],
                [80, 170],
                [120, 170],
                [75, 230],
                [125, 230],
                [85, 290],
                [115, 290],
                [100, 340],
              ].map(([x, y], i) => (
                <motion.circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={3}
                  fill="oklch(0.78 0.16 165)"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0.6], scale: [0, 1.4, 1] }}
                  transition={{ duration: 1.2, delay: i * 0.12, repeat: Infinity, repeatDelay: 4 }}
                />
              ))}
            </svg>

            {/* sweeping scan line */}
            {!done && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute inset-x-0 h-[140px]"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent, oklch(0.78 0.16 165 / 0.35), transparent)",
                    boxShadow: "0 0 80px oklch(0.78 0.16 165 / 0.6)",
                  }}
                  animate={{ y: ["-20%", "120%"] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            )}

            {/* center pulse */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-primary glow-ring" />
              </span>
            </div>
          </div>

          {/* corner brackets */}
          <CornerBrackets />
        </div>

        {/* RIGHT — telemetry */}
        <div className="flex flex-col">
          <span className="label-mono">// FEETFIRST · BIOMECHANICAL SCAN v3.2</span>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-tight md:text-6xl">
            {done ? (
              <>
                Signature <span className="text-emerald-gradient">acquired.</span>
              </>
            ) : (
              <>
                Reading your <span className="text-emerald-gradient">anatomy</span>.
              </>
            )}
          </h1>

          <div className="mt-8 glass rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <span className="label-mono text-primary">
                {done ? "COMPLETE" : PHASES[Math.min(phase, PHASES.length - 1)].k}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {String(Math.min(phase + 1, PHASES.length)).padStart(2, "0")} /{" "}
                {String(PHASES.length).padStart(2, "0")}
              </span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-3"
              >
                <div className="font-display text-2xl font-semibold">
                  {done
                    ? "Biomechanical signature locked."
                    : PHASES[Math.min(phase, PHASES.length - 1)].t}
                </div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">
                  {done
                    ? "12.4M profiles compared · confidence 98.6%"
                    : PHASES[Math.min(phase, PHASES.length - 1)].sub}
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="mt-5 h-px overflow-hidden bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent"
                animate={{
                  width: `${(Math.min(phase + 1, PHASES.length) / PHASES.length) * 100}%`,
                }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {METRICS.map((m, i) => (
              <motion.div
                key={m.l}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: phase > 1 || done ? 1 : 0.25, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className="glass rounded-xl p-4"
              >
                <span className="label-mono">{m.l}</span>
                <div className="mt-2 font-display text-lg font-semibold">{m.v}</div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    initial={{ width: 0 }}
                    animate={{ width: done || phase > 1 ? `${m.n}%` : 0 }}
                    transition={{ duration: 1.1, delay: 0.1 * i, ease: "easeOut" }}
                    style={{ boxShadow: "0 0 10px oklch(0.78 0.16 165 / 0.55)" }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push("/ski-rental/rental")}
              className="label-mono hover:text-foreground"
            >
              ← SKIP SCAN
            </button>
            <button
              disabled={!done}
              onClick={() => router.push("/ski-rental/results?mode=rental")}
              className="group relative inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-semibold tracking-[0.2em] text-primary-foreground transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted-foreground"
            >
              <span className="absolute inset-0 rounded-full bg-primary/40 blur-xl opacity-0 transition group-enabled:group-hover:opacity-100" />
              <span className="relative">{done ? "GENERATE SETUP" : "ANALYSING…"}</span>
              <span className="relative">→</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function CornerBrackets() {
  const c = "absolute h-6 w-6 border-primary/60";
  return (
    <>
      <span className={`${c} left-0 top-0 border-l border-t`} />
      <span className={`${c} right-0 top-0 border-r border-t`} />
      <span className={`${c} bottom-0 left-0 border-b border-l`} />
      <span className={`${c} bottom-0 right-0 border-b border-r`} />
    </>
  );
}
