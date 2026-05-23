"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Particles } from "@/ski-rental/components/Particles";

const VALID = ["A-103", "FF-7K42-RDR"];

type Stage = "input" | "verifying" | "found" | "instructions" | "complete";

const RETURN_STEPS = [
  "Identifying equipment",
  "Photographing condition",
  "Routing to drying station",
  "Routing to disinfection",
  "Closing rental ledger",
];

export default function Return() {
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<Stage>("input");
  const [error, setError] = useState<string | null>(null);
  const [inspectStep, setInspectStep] = useState(0);

  const submit = () => {
    if (code.trim().length < 3) {
      setError("Enter your reservation or preparation number.");
      return;
    }
    setError(null);
    setStage("verifying");
    setTimeout(() => setStage("found"), 1500);
  };

  useEffect(() => {
    if (stage !== "complete") return;
    setInspectStep(0);
    const id = setInterval(
      () =>
        setInspectStep((s) => {
          if (s >= RETURN_STEPS.length - 1) {
            clearInterval(id);
            return s;
          }
          return s + 1;
        }),
      1100,
    );
    return () => clearInterval(id);
  }, [stage]);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <Particles density={60} />
      <div className="absolute inset-x-0 top-0 h-[55vh] bg-[radial-gradient(circle_at_50%_10%,oklch(0.78_0.16_165/0.16),transparent_70%)]" />

      <header className="relative z-10 flex items-center justify-between px-10 py-8">
        <Link href="/ski-rental/start" className="label-mono hover:text-foreground">
          ← BACK
        </Link>
        <span className="label-mono">// RETURN · DROP-OFF STATION</span>
        <Link href="/ski-rental" className="label-mono hover:text-foreground">
          CANCEL
        </Link>
      </header>

      <section className="relative mx-auto max-w-5xl px-6 pt-8 pb-20">
        <AnimatePresence mode="wait">
          {stage === "input" && (
            <motion.div
              key="in"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <h1 className="text-balance font-display text-[clamp(3rem,6vw,5.5rem)] font-semibold leading-[0.95] tracking-tight">
                Returning your kit? <span className="text-emerald-gradient">Welcome back.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
                Enter your reservation number or preparation number — or scan the QR on your tag.
              </p>

              <div className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
                <div className="glass-strong rounded-3xl p-10">
                  <span className="label-mono">RESERVATION / PREP NUMBER</span>
                  <input
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="A-103"
                    className="mt-4 w-full bg-transparent font-mono text-5xl font-semibold tracking-[0.25em] outline-none placeholder:text-white/15 md:text-6xl"
                  />
                  <div className="mt-6 h-px bg-white/10" />
                  <div className="mt-4 font-mono text-xs text-muted-foreground">
                    Try{" "}
                    <button
                      onClick={() => setCode("A-103")}
                      className="text-primary hover:underline"
                    >
                      A-103
                    </button>{" "}
                    for a demo.
                  </div>
                  {error && <div className="mt-4 font-mono text-xs text-destructive">{error}</div>}
                  <button
                    onClick={submit}
                    className="group relative mt-10 inline-flex w-full items-center justify-center gap-3 rounded-full bg-primary px-8 py-5 text-sm font-semibold tracking-[0.32em] text-primary-foreground"
                  >
                    <span className="absolute inset-0 rounded-full bg-primary/40 blur-xl opacity-0 transition group-hover:opacity-100" />
                    <span className="relative">FIND MY RENTAL</span>
                    <span className="relative">→</span>
                  </button>
                </div>

                <div className="glass rounded-3xl p-10 text-center">
                  <span className="label-mono">OR SCAN QR</span>
                  <div className="relative mx-auto mt-6 h-48 w-48 overflow-hidden rounded-2xl border border-primary/40">
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.18_0.008_240),oklch(0.10_0.008_240))]" />
                    <Brackets />
                    <motion.div
                      className="absolute inset-x-2 h-0.5 bg-primary"
                      style={{ boxShadow: "0 0 18px oklch(0.78 0.16 165 / 0.8)" }}
                      animate={{ y: [8, 180, 8] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-primary/70">
                      SCANNING…
                    </span>
                  </div>
                  <div className="mt-6 font-mono text-xs text-muted-foreground">
                    Hold your tag QR in the frame
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {stage === "verifying" && (
            <motion.div
              key="ver"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[60vh] flex-col items-center justify-center"
            >
              <div className="relative h-32 w-32">
                <div className="absolute inset-0 rounded-full border border-primary/30" />
                <div
                  className="absolute inset-0 animate-spin rounded-full border-t-2 border-primary"
                  style={{ animationDuration: "1.4s" }}
                />
                <div className="absolute inset-0 flex items-center justify-center label-mono text-primary">
                  VERIFY
                </div>
              </div>
              <div className="mt-8 font-display text-3xl font-semibold">
                Looking up your rental…
              </div>
              <div className="mt-2 font-mono text-xs text-muted-foreground">
                Cross-checking ledger · {code}
              </div>
            </motion.div>
          )}

          {stage === "found" && (
            <motion.div key="found" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <span className="label-mono text-primary">// RENTAL FOUND · {code}</span>
              <h1 className="mt-3 font-display text-5xl font-semibold leading-tight md:text-6xl">
                Welcome back, <span className="text-emerald-gradient">Marco.</span>
              </h1>

              <div className="mt-10 glass-strong rounded-3xl p-8">
                <div className="flex items-center justify-between">
                  <span className="label-mono">// EQUIPMENT TO RETURN</span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary glow-ring" />
                    <span className="label-mono text-primary">3 DAYS · 4 ITEMS</span>
                  </span>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {[
                    { c: "BOOTS", n: "Lange RS 130 LV", m: "27.5" },
                    { c: "SKIS", n: "Atomic Redster G9 RS", m: "168 cm" },
                    { c: "HELMET", n: "Smith Vantage MIPS", m: "M" },
                    { c: "POLES", n: "Leki WCR Lite SL", m: "120 cm" },
                  ].map((it, i) => (
                    <motion.div
                      key={it.c}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="rounded-2xl border border-white/5 bg-white/[0.02] p-4"
                    >
                      <span className="label-mono">{it.c}</span>
                      <div className="mt-2 font-display text-lg font-semibold">{it.n}</div>
                      <div className="font-mono text-xs text-muted-foreground">{it.m}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStage("instructions")}
                className="group relative mt-10 inline-flex w-full items-center justify-center gap-3 rounded-full bg-primary px-8 py-5 text-sm font-semibold tracking-[0.3em] text-primary-foreground"
              >
                <span className="absolute inset-0 rounded-full bg-primary/40 blur-xl opacity-0 transition group-hover:opacity-100" />
                <span className="relative">START RETURN →</span>
              </button>
            </motion.div>
          )}

          {stage === "instructions" && (
            <motion.div
              key="inst"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center"
            >
              <span className="label-mono text-primary">// RETURN STATION · BAY 03</span>
              <h1 className="mt-3 font-display text-[clamp(2.4rem,5vw,4rem)] font-semibold leading-[1.02]">
                Please place equipment{" "}
                <span className="text-emerald-gradient">at the return station.</span>
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                Drop boots & skis onto the lit platform. The terminal photographs and identifies
                them automatically.
              </p>

              <div className="relative mt-12 h-64 w-64">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border border-primary/30"
                    style={{ inset: i * 16 }}
                    animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.2, 0.6] }}
                    transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.4 }}
                  />
                ))}
                <div className="absolute inset-0 flex items-center justify-center label-mono text-primary">
                  PLATFORM ACTIVE
                </div>
              </div>

              <button
                onClick={() => setStage("complete")}
                className="group relative mt-12 inline-flex items-center justify-center gap-3 rounded-full bg-primary px-10 py-5 text-sm font-semibold tracking-[0.3em] text-primary-foreground"
              >
                <span className="absolute inset-0 rounded-full bg-primary/40 blur-xl opacity-0 transition group-hover:opacity-100" />
                <span className="relative">EQUIPMENT PLACED →</span>
              </button>
            </motion.div>
          )}

          {stage === "complete" && (
            <motion.div key="done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-primary glow-ring" />
                </span>
                <span className="label-mono text-primary">RETURN CONFIRMED · {code}</span>
              </div>
              <h1 className="mt-4 font-display text-5xl font-semibold leading-tight md:text-7xl">
                Thank you, <span className="text-emerald-gradient">Marco.</span>
              </h1>
              <p className="mt-4 max-w-xl text-muted-foreground">
                Equipment received. Inspection in progress.
              </p>

              <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                <div className="glass-strong rounded-3xl p-8">
                  <span className="label-mono">// SMART INSPECTION</span>
                  <div className="mt-6 space-y-5">
                    {RETURN_STEPS.map((s, i) => {
                      const done = i < inspectStep;
                      const active = i === inspectStep;
                      return (
                        <motion.div
                          key={s}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="relative flex items-start gap-4"
                        >
                          <div className="relative">
                            <div
                              className={`h-7 w-7 rounded-full border ${
                                done
                                  ? "border-primary bg-primary"
                                  : active
                                    ? "border-primary bg-primary/20 glow-ring"
                                    : "border-white/15"
                              } flex items-center justify-center`}
                            >
                              {done && (
                                <span className="text-[10px] text-primary-foreground">✓</span>
                              )}
                              {active && (
                                <motion.span
                                  className="h-2 w-2 rounded-full bg-primary"
                                  animate={{ scale: [0.6, 1.2, 0.6] }}
                                  transition={{ duration: 1.4, repeat: Infinity }}
                                />
                              )}
                            </div>
                            {i < RETURN_STEPS.length - 1 && (
                              <div
                                className={`absolute left-1/2 top-7 h-10 w-px -translate-x-1/2 ${done ? "bg-primary/60" : "bg-white/10"}`}
                              />
                            )}
                          </div>
                          <div className="pb-6">
                            <div
                              className={`font-display text-lg font-semibold ${active || done ? "text-foreground" : "text-muted-foreground"}`}
                            >
                              {s}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div className="glass-strong rounded-3xl p-8 flex flex-col">
                  <span className="label-mono">// FINAL STATUS</span>
                  <div className="mt-4 font-display text-3xl font-semibold leading-tight">
                    All clear. No damages.
                  </div>
                  <div className="mt-2 text-muted-foreground">Receipt sent to your email.</div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <KPI l="DURATION" v="3 days" />
                    <KPI l="TOTAL" v="€ 186.00" />
                    <KPI l="DEPOSIT" v="Released" />
                    <KPI l="REWARDS" v="+42 pts" />
                  </div>
                  <Link
                    href="/ski-rental"
                    className="group relative mt-auto inline-flex w-full items-center justify-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-semibold tracking-[0.3em] text-primary-foreground"
                  >
                    <span className="absolute inset-0 rounded-full bg-primary/40 blur-xl opacity-0 transition group-hover:opacity-100" />
                    <span className="relative">DONE →</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}

function KPI({ l, v }: { l: string; v: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <span className="label-mono">{l}</span>
      <div className="mt-1 font-display text-base">{v}</div>
    </div>
  );
}
function Brackets() {
  const c = "absolute h-5 w-5 border-primary/70";
  return (
    <>
      <span className={`${c} left-0 top-0 border-l border-t`} />
      <span className={`${c} right-0 top-0 border-r border-t`} />
      <span className={`${c} bottom-0 left-0 border-b border-l`} />
      <span className={`${c} bottom-0 right-0 border-b border-r`} />
    </>
  );
}
