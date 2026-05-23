"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Particles } from "@/ski-rental/components/Particles";

const VALID = "FF-7K42-RDR";

type Stage = "input" | "verifying" | "found";

export default function Pickup() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<Stage>("input");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (code.trim().length < 4) {
      setError("Enter your booking number.");
      return;
    }
    setError(null);
    setStage("verifying");
    setTimeout(() => setStage("found"), 1600);
  };

  const reset = () => {
    setStage("input");
    setCode("");
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <Particles density={60} />
      <div className="absolute inset-x-0 top-0 h-[55vh] bg-[radial-gradient(circle_at_50%_10%,oklch(0.78_0.16_165/0.16),transparent_70%)]" />

      <header className="relative z-10 flex items-center justify-between px-10 py-8">
        <Link href="/ski-rental/start" className="label-mono hover:text-foreground">
          ← BACK
        </Link>
        <span className="label-mono">// PICKUP · RESERVATION LOOKUP</span>
        <Link href="/ski-rental" className="label-mono hover:text-foreground">
          CANCEL
        </Link>
      </header>

      <section className="relative mx-auto max-w-5xl px-6 pt-8 pb-20">
        <AnimatePresence mode="wait">
          {stage === "input" && (
            <motion.div
              key="in"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-balance font-display text-[clamp(3rem,6vw,5.5rem)] font-semibold leading-[0.95] tracking-tight">
                Welcome back. Let's <span className="text-emerald-gradient">find your kit.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
                Enter the booking number from your confirmation email — or scan your QR.
              </p>

              <div className="mt-16 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
                {/* code input */}
                <div className="glass-strong rounded-3xl p-10">
                  <span className="label-mono">BOOKING NUMBER</span>
                  <input
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="FF-XXXX-XXX"
                    className="mt-4 w-full bg-transparent font-mono text-5xl font-semibold tracking-[0.25em] outline-none placeholder:text-white/15 md:text-6xl"
                  />
                  <div className="mt-6 h-px bg-white/10" />
                  <div className="mt-4 font-mono text-xs text-muted-foreground">
                    Try{" "}
                    <button
                      onClick={() => setCode(VALID)}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {VALID}
                    </button>{" "}
                    for a demo lookup.
                  </div>
                  {error && <div className="mt-4 font-mono text-xs text-destructive">{error}</div>}

                  <button
                    onClick={submit}
                    className="group relative mt-10 inline-flex w-full items-center justify-center gap-3 rounded-full bg-primary px-8 py-5 text-sm font-semibold tracking-[0.32em] text-primary-foreground"
                  >
                    <span className="absolute inset-0 rounded-full bg-primary/40 blur-xl opacity-0 transition group-hover:opacity-100" />
                    <span className="relative">FIND MY RESERVATION</span>
                    <span className="relative">→</span>
                  </button>
                </div>

                {/* QR scan */}
                <div className="glass rounded-3xl p-10 text-center">
                  <span className="label-mono">OR SCAN QR</span>
                  <div className="relative mx-auto mt-6 h-48 w-48 overflow-hidden rounded-2xl border border-primary/40">
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.18_0.008_240),oklch(0.10_0.008_240))]" />
                    <CornerBrackets />
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
                    Hold your phone QR in the frame
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
                Looking up your reservation…
              </div>
              <div className="mt-2 font-mono text-xs text-muted-foreground">
                Cross-checking ledger · {code}
              </div>
            </motion.div>
          )}

          {stage === "found" && (code === VALID || code.startsWith("FF")) && (
            <motion.div
              key="found"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <FoundPanel code={code} onConfirm={() => router.push("/ski-rental/checkout")} onReset={reset} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}

function FoundPanel({
  code,
  onConfirm,
  onReset,
}: {
  code: string;
  onConfirm: () => void;
  onReset: () => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-primary glow-ring" />
        </span>
        <span className="label-mono text-primary">RESERVATION FOUND · {code}</span>
      </div>

      <h1 className="mt-4 font-display text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[0.98]">
        Welcome, <span className="text-emerald-gradient">Marco.</span>
      </h1>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="glass-strong rounded-3xl p-8">
          <span className="label-mono">// RESERVED EQUIPMENT</span>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              { c: "SKIS", n: "Atomic Redster G9 RS", m: "168 cm" },
              { c: "BOOTS", n: "Lange RS 130", m: "27.5 · flex 122" },
              { c: "HELMET", n: "Smith Vantage MIPS", m: "M · disinfected" },
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

          <div className="mt-8 grid gap-4 md:grid-cols-3 text-sm">
            <KV l="PICKUP" v="Sat · 09:30" />
            <KV l="DURATION" v="3 days" />
            <KV l="LOCATION" v="Innsbruck Flagship · Bay 03" />
          </div>

          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
            <span className="h-2 w-2 rounded-full bg-primary glow-ring" />
            <span className="label-mono text-primary">READY · DRIED · DISINFECTED · TUNED</span>
          </div>
        </div>

        <div className="glass rounded-3xl p-8 text-center">
          <span className="label-mono">// PICKUP QR</span>
          <div className="relative mx-auto mt-6 h-48 w-48 overflow-hidden rounded-xl border border-primary/40 bg-white p-2">
            <PseudoQR />
          </div>
          <div className="mt-4 font-mono text-xl font-semibold tracking-[0.25em]">{code}</div>
          <button
            onClick={onConfirm}
            className="group relative mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-semibold tracking-[0.3em] text-primary-foreground"
          >
            <span className="absolute inset-0 rounded-full bg-primary/40 blur-xl opacity-0 transition group-hover:opacity-100" />
            <span className="relative">CONFIRM PICKUP</span>
            <span className="relative">→</span>
          </button>
          <button onClick={onReset} className="mt-4 label-mono hover:text-foreground">
            USE A DIFFERENT CODE
          </button>
        </div>
      </div>
    </div>
  );
}

function KV({ l, v }: { l: string; v: string }) {
  return (
    <div>
      <span className="label-mono">{l}</span>
      <div className="mt-1 font-display text-base">{v}</div>
    </div>
  );
}

function CornerBrackets() {
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

function PseudoQR() {
  const cells = Array.from({ length: 13 * 13 }, (_, i) => (i * 1103515245 + 12345) % 7 < 3);
  return (
    <div
      className="grid h-full w-full"
      style={{ gridTemplateColumns: "repeat(13,1fr)", gap: "2px" }}
    >
      {cells.map((on, i) => (
        <div key={i} className={on ? "bg-black" : "bg-transparent"} />
      ))}
    </div>
  );
}
