"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Nav } from "@/ski-rental/components/Nav";
import { Particles } from "@/ski-rental/components/Particles";
import { setGroup, useGroup } from "@/ski-rental/lib/session";

const PLANS = [
  {
    k: "none" as const,
    name: "No protection",
    price: 0,
    tone: "muted",
    desc: "You're responsible for theft, damage, and loss.",
    bullets: ["Standard rental terms apply", "Replacement charged at full retail"],
  },
  {
    k: "standard" as const,
    name: "Standard protection",
    price: 6,
    tone: "primary",
    desc: "Recommended for most riders. Covers accidental damage and minor incidents.",
    bullets: ["Damage protection", "Replacement waiver", "On-mountain swap"],
  },
  {
    k: "premium" as const,
    name: "Premium protection",
    price: 12,
    tone: "accent",
    desc: "Maximum cover for groups, families, and high-performance equipment.",
    bullets: ["Damage + theft + accident", "Same-day replacement", "Priority queue at return"],
  },
];

export default function Insurance() {
  const g = useGroup();
  const router = useRouter();
  const choice = g.insurance ?? "standard";
  const ppl = Math.max(1, g.people.length);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <Nav />
      <div className="absolute inset-0 bg-grid opacity-30" />
      <Particles density={40} />

      <section className="relative mx-auto max-w-7xl px-6 pt-28 pb-20">
        <span className="label-mono text-primary">// PROTECT YOUR RENTAL</span>
        <h1 className="mt-3 font-display text-5xl font-semibold leading-tight md:text-6xl">
          Ride confident. <span className="text-emerald-gradient">Choose your protection.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Optional. Per person · per day. Adjust now or skip — changes apply to the entire group.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLANS.map((p, i) => {
            const selected = choice === p.k;
            return (
              <motion.button
                key={p.k}
                onClick={() => setGroup({ insurance: p.k })}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`group relative overflow-hidden rounded-3xl p-8 text-left transition-all ${
                  selected
                    ? "glass-strong border-primary/60 shadow-[0_0_60px_oklch(0.78_0.16_165/0.25)]"
                    : "glass hover:border-white/20"
                }`}
              >
                {selected && (
                  <span className="absolute right-5 top-5 h-2 w-2 rounded-full bg-primary glow-ring" />
                )}
                <div className="label-mono">{p.name.toUpperCase()}</div>
                <div className="mt-6 flex items-end gap-2">
                  <div className="font-display text-5xl font-semibold">
                    {p.price === 0 ? "—" : `€${p.price}`}
                  </div>
                  {p.price > 0 && (
                    <div className="pb-1.5 font-mono text-xs text-muted-foreground">
                      /person · day
                    </div>
                  )}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{p.desc}</p>
                <ul className="mt-6 space-y-2">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary glow-ring" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-between rounded-2xl glass-strong p-6">
          <div>
            <div className="label-mono">PROTECTION ESTIMATE</div>
            <div className="mt-2 font-display text-3xl font-semibold">
              €{(PLANS.find((p) => p.k === choice)?.price ?? 0) * ppl}{" "}
              <span className="font-mono text-sm text-muted-foreground">
                / day · {ppl} {ppl === 1 ? "person" : "people"}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/ski-rental/group" className="label-mono self-center hover:text-foreground">
              ← BACK
            </Link>
            <button
              type="button"
              onClick={() => router.push("/ski-rental/checkout")}
              className="rounded-full bg-primary px-10 py-4 text-sm font-semibold tracking-[0.3em] text-primary-foreground transition hover:shadow-[0_0_60px_oklch(0.78_0.16_165/0.5)]"
            >
              CONTINUE TO CHECKOUT →
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
