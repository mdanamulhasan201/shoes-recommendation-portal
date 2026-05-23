"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Nav } from "@/ski-rental/components/Nav";
import { Particles } from "@/ski-rental/components/Particles";
import { useGroup, setGroup } from "@/ski-rental/lib/session";

const STAGES = [
  "VERIFYING AVAILABILITY",
  "ALLOCATING EQUIPMENT",
  "GENERATING PREPARATION NUMBER",
  "CONFIRMED",
];

const PREP_STATES = [
  { l: "Reservation received", k: "received" },
  { l: "Equipment being prepared", k: "prep" },
  { l: "Boot fitting in progress", k: "boot" },
  { l: "Final setup check", k: "check" },
  { l: "Ready for pickup", k: "ready" },
];

function genPrepNumber() {
  const letters = "ABCD";
  const L = letters[Math.floor(Math.random() * letters.length)];
  const N = 100 + Math.floor(Math.random() * 60);
  return `${L}-${N}`;
}

export default function Checkout() {
  const g = useGroup();
  const [stage, setStage] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [pay, setPay] = useState<"apple" | "card" | "klarna">("apple");
  const [prep] = useState(() => g.prepNumber || genPrepNumber());
  const [activeState, setActiveState] = useState(0);

  useEffect(() => {
    if (!g.prepNumber) setGroup({ prepNumber: prep });
  }, [prep, g.prepNumber]);

  const ppl = Math.max(1, g.people.length);
  const insurancePerDay = g.insurance === "premium" ? 12 : g.insurance === "standard" ? 6 : 0;
  void ppl;
  void insurancePerDay;

  const confirm = () => {
    setStage(0);
    setConfirmed(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      if (i >= STAGES.length - 1) {
        clearInterval(id);
        setStage(STAGES.length - 1);
        setTimeout(() => setConfirmed(true), 500);
      } else setStage(i);
    }, 700);
  };

  // simulate live preparation progress after confirmation
  useEffect(() => {
    if (!confirmed) return;
    const id = setInterval(() => {
      setActiveState((s) => Math.min(s + 1, PREP_STATES.length - 1));
    }, 2200);
    return () => clearInterval(id);
  }, [confirmed]);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <Nav />
      <div className="absolute inset-0 bg-grid opacity-30" />
      <Particles density={50} />

      <section className="relative mx-auto max-w-7xl px-6 pt-28 pb-20">
        <span className="label-mono">// CHECKOUT · RESERVATION</span>
        <h1 className="mt-3 font-display text-5xl font-semibold leading-tight md:text-6xl">
          {confirmed ? (
            <>
              Reservation <span className="text-emerald-gradient">locked.</span>
            </>
          ) : (
            <>
              One tap to <span className="text-emerald-gradient">confirm.</span>
            </>
          )}
        </h1>

        {!confirmed && (
          <div className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="glass-strong rounded-3xl p-8">
              <div className="flex items-center justify-between">
                <span className="label-mono">// AI ENGINEERED SETUP</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary glow-ring" />
                  <span className="label-mono text-primary">97% COMPATIBLE</span>
                </span>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  { c: "BOOTS", n: "Lange RS 130 LV", m: "27.5 · custom flex 130" },
                  { c: "SKIS", n: "Atomic Redster G9 RS", m: "168 cm · race carving" },
                  { c: "HELMET", n: "Smith Vantage MIPS", m: "M · disinfected" },
                  { c: "POLES", n: "Leki WCR Lite SL", m: "120 cm · carbon" },
                ].map((it, i) => (
                  <motion.div
                    key={it.c}
                    initial={{ opacity: 0, y: 10 }}
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
                <div>
                  <span className="label-mono">PICKUP</span>
                  <div className="mt-1 font-display text-base">Sat · 09:30</div>
                </div>
                <div>
                  <span className="label-mono">DURATION</span>
                  <div className="mt-1 font-display text-base">3 days</div>
                </div>
                <div>
                  <span className="label-mono">RETURN</span>
                  <div className="mt-1 font-display text-base">Mon · before 17:00</div>
                </div>
              </div>

              {/* RETURN INFO — prominent */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/5 p-6">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <span className="label-mono text-primary">// RETURN YOUR EQUIPMENT</span>
                    <div className="mt-2 font-display text-2xl font-semibold leading-tight md:text-3xl">
                      Monday · before <span className="text-emerald-gradient">17:00</span>
                    </div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">
                      Late returns are billed €15 / hour. We send a 2 h reminder.
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="label-mono">RETURN STATION</span>
                    <div className="mt-1 font-display text-base font-semibold">
                      FEETFIRST Return Station
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      Innsbruck Flagship · Bay 03
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass rounded-2xl p-6">
                <span className="label-mono">// PAYMENT</span>
                <div className="mt-4 space-y-2">
                  {[
                    { k: "apple", l: "Apple Pay", s: "Touch ID · instant" },
                    { k: "card", l: "Card", s: "Visa · MasterCard · Amex" },
                    { k: "klarna", l: "Klarna", s: "Pay in 3" },
                  ].map((p) => (
                    <button
                      key={p.k}
                      onClick={() => setPay(p.k as never)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                        pay === p.k
                          ? "border-primary/60 bg-primary/10"
                          : "border-white/5 hover:border-white/15"
                      }`}
                    >
                      <div>
                        <div className="font-display text-sm font-semibold">{p.l}</div>
                        <div className="font-mono text-xs text-muted-foreground">{p.s}</div>
                      </div>
                      {pay === p.k && (
                        <span className="h-2 w-2 rounded-full bg-primary glow-ring" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-strong rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <span className="label-mono">SUBTOTAL</span>
                  <span className="font-mono text-sm">€ 186.00</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="label-mono">SERVICE</span>
                  <span className="font-mono text-sm">€ 0.00</span>
                </div>
                <div className="mt-4 h-px bg-white/10" />
                <div className="mt-4 flex items-end justify-between">
                  <span className="label-mono">TOTAL</span>
                  <span className="font-display text-4xl font-semibold">€ 186.00</span>
                </div>
                <button
                  onClick={confirm}
                  className="group relative mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-semibold tracking-[0.2em] text-primary-foreground"
                >
                  <span className="absolute inset-0 rounded-full bg-primary/40 blur-xl opacity-0 transition group-hover:opacity-100" />
                  <span className="relative">CONFIRM RESERVATION</span>
                  <span className="relative">→</span>
                </button>
                <div className="mt-3 text-center font-mono text-[10px] text-muted-foreground">
                  Encrypted · 3-D Secure · No card hold
                </div>
              </div>
            </div>
          </div>
        )}

        {confirmed && <ConfirmedView prep={prep} activeState={activeState} />}
      </section>

      <AnimatePresence>
        {stage > 0 && !confirmed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-background/85 backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-[min(560px,92vw)] glass-strong rounded-3xl p-10"
            >
              <span className="label-mono">// PROCESSING</span>
              <div className="mt-4 font-display text-3xl font-semibold">{STAGES[stage]}</div>
              <div className="mt-8 space-y-3">
                {STAGES.slice(0, -1).map((s, i) => (
                  <div key={s} className="flex items-center gap-3 font-mono text-xs">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${i <= stage ? "bg-primary glow-ring" : "bg-white/15"}`}
                    />
                    <span className={i <= stage ? "text-foreground" : "text-muted-foreground"}>
                      {s}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-8 h-px overflow-hidden bg-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  animate={{ width: `${((stage + 1) / STAGES.length) * 100}%` }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function ConfirmedView({ prep, activeState }: { prep: string; activeState: number }) {
  const isReady = activeState >= PREP_STATES.length - 1;

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      {/* HERO Preparation number */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
        className="glass-strong relative overflow-hidden rounded-3xl p-10"
      >
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative">
          <span className="label-mono text-primary">// PREPARATION NUMBER</span>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 flex items-baseline gap-6"
          >
            <div className="font-display text-[clamp(6rem,18vw,14rem)] font-semibold leading-none text-emerald-gradient">
              {prep}
            </div>
            <div>
              <div className="label-mono text-primary">
                {isReady ? "READY FOR PICKUP" : "PREPARING"}
              </div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">
                Bay · 03 · Innsbruck Flagship
              </div>
            </div>
          </motion.div>

          <p className="mt-6 max-w-md text-muted-foreground">
            Show this number to staff at pickup. We've sent it to your email and pushed it to
            operations.
          </p>

          <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-5">
            <span className="label-mono text-primary">// RETURN YOUR EQUIPMENT</span>
            <div className="mt-2 font-display text-xl font-semibold">
              Monday · before <span className="text-emerald-gradient">17:00</span> · FEETFIRST
              Return Station
            </div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">
              Reminder pushed to email + QR pickup page.
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Pill>EMAIL SENT</Pill>
            <Pill>PUSHED TO OPS</Pill>
            <Pill>QUEUE POSITION · 2</Pill>
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6">
            <Link href="/ski-rental" className="label-mono hover:text-foreground">
              ← HOME
            </Link>
            <Link href="/ski-rental/start" className="label-mono text-primary hover:text-foreground">
              VIEW IN OPS →
            </Link>
          </div>
        </div>
      </motion.div>

      {/* live preparation states */}
      <div className="glass-strong rounded-3xl p-8">
        <span className="label-mono">// LIVE PREPARATION STATUS</span>
        <div className="mt-6 space-y-5">
          {PREP_STATES.map((s, i) => {
            const done = i < activeState;
            const active = i === activeState;
            return (
              <motion.div
                key={s.k}
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
                          : "border-white/15 bg-transparent"
                    } flex items-center justify-center`}
                  >
                    {done && <span className="text-[10px] text-primary-foreground">✓</span>}
                    {active && (
                      <motion.span
                        className="h-2 w-2 rounded-full bg-primary"
                        animate={{ scale: [0.6, 1.2, 0.6] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                      />
                    )}
                  </div>
                  {i < PREP_STATES.length - 1 && (
                    <div
                      className={`absolute left-1/2 top-7 h-10 w-px -translate-x-1/2 ${done ? "bg-primary/60" : "bg-white/10"}`}
                    />
                  )}
                </div>
                <div className="pb-6">
                  <div
                    className={`font-display text-lg font-semibold ${active || done ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {s.l}
                  </div>
                  {active && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-1 font-mono text-xs text-primary"
                    >
                      In progress…
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {isReady && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-2xl border border-primary/40 bg-primary/10 p-5"
          >
            <div className="label-mono text-primary">// CALLED FOR PICKUP</div>
            <div className="mt-2 font-display text-xl font-semibold">
              "Preparation {prep} ready for pickup."
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 label-mono">
      <span className="h-1.5 w-1.5 rounded-full bg-primary glow-ring" />
      {children}
    </span>
  );
}
