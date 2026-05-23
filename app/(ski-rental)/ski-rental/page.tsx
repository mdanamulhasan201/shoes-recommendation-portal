"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import heroImg from "@/ski-rental/assets/hero.jpg";
import { Particles } from "@/ski-rental/components/Particles";
import { LangSelector } from "@/ski-rental/components/LangSelector";
import { useGroup } from "@/ski-rental/lib/session";
import { t } from "@/ski-rental/lib/i18n";
import { assetSrc } from "@/ski-rental/lib/utils";

const TAGLINES = [
  "YOUR PERFECT SKI DAY STARTS HERE",
  "AI-POWERED SKI FITTING",
  "BUILD YOUR PERFECT SETUP",
  "SCAN · MATCH · RIDE",
];

export default function Terminal() {
  const router = useRouter();
  const g = useGroup();
  const [tagIdx, setTagIdx] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const a = setInterval(() => setTagIdx((i) => (i + 1) % TAGLINES.length), 4200);
    const b = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, []);

  const wake = () => router.push("/ski-rental/start");

  return (
    <main
      onClick={wake}
      onTouchStart={wake}
      className="relative h-screen w-screen cursor-pointer select-none overflow-hidden"
    >
      {/* ambient backdrop */}
      <div className="absolute inset-0">
        <img src={assetSrc(heroImg)} alt="" className="h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        <div className="absolute inset-0 bg-grid opacity-50" />
        <Particles density={120} />
      </div>

      {/* slow holographic ski silhouette drifting */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{ y: [-12, 12, -12], rotate: [-2, 2, -2] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      >
        <SkiHologram />
      </motion.div>

      {/* corner brackets — terminal feel */}
      <Bracket pos="tl" />
      <Bracket pos="tr" />
      <Bracket pos="bl" />
      <Bracket pos="br" />

      {/* top telemetry bar */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-10 py-6">
        <div className="flex items-center gap-3">
          <span className="relative flex h-7 w-7 items-center justify-center">
            <span className="absolute inset-0 rounded-md bg-primary/30 blur-md" />
            <span className="relative h-3 w-3 rounded-sm bg-primary glow-ring" />
          </span>
          <span className="font-display text-sm font-semibold tracking-[0.42em]">FEETFIRST</span>
          <span className="ml-4 label-mono">TERMINAL · INNSBRUCK FLAGSHIP</span>
        </div>
        <div className="flex items-center gap-6 font-mono text-xs text-muted-foreground">
          <span>NEURAL · ONLINE</span>
          <span className="text-primary">−4°C · LIGHT SNOW</span>
          <Clock tick={tick} />
          <div onClick={(e) => e.stopPropagation()}>
            <LangSelector compact />
          </div>
        </div>
      </div>

      {/* center messaging */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="label-mono mb-8 text-primary"
        >
          {/* {t(g.language, "tap_to_begin").toUpperCase()} · ATTRACT MODE */}
          Tap the screen to begin
        </motion.span>

        <AnimatePresence mode="wait">
          <motion.h1
            key={tagIdx}
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -24, filter: "blur(8px)" }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-balance font-display text-[clamp(3rem,9vw,9rem)] font-semibold leading-[0.92] tracking-tight"
          >
            <span className="text-emerald-gradient">{TAGLINES[tagIdx]}</span>
          </motion.h1>
        </AnimatePresence>

        <p className="mt-10 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
          Step closer. The terminal scans your foot, reads your ride, and engineers your setup in
          seconds.
        </p>

        {/* huge tap pulse */}
        <motion.div
          className="mt-16 flex flex-col items-center gap-4"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="relative">
            <span className="absolute inset-0 -m-10 animate-pulse-ring rounded-full" />
            <span className="absolute inset-0 -m-6 rounded-full bg-primary/20 blur-3xl" />
            <span className="relative flex h-44 w-44 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <span className="absolute inset-2 rounded-full border border-white/30" />
              <span className="absolute inset-6 rounded-full border border-white/10" />
              <span className="relative font-display text-base font-semibold tracking-[0.42em]">
                TAP
              </span>
            </span>
          </div>
          <span className="label-mono mt-2 text-foreground/70">TOUCH SCREEN TO START</span>
        </motion.div>
      </div>

      {/* bottom telemetry */}
      <div className="absolute inset-x-0 bottom-0 z-10 grid grid-cols-3 gap-6 px-10 py-6 font-mono text-xs text-muted-foreground">
        <div>
          <span className="label-mono block">SCAN PRECISION</span>
          <span className="text-foreground/70">±0.4 MM · 12 240 PTS/S</span>
        </div>
        <div className="text-center">
          <span className="label-mono block">RENTALS TODAY</span>
          <span className="text-foreground/70">127 ACTIVE · 318 READY</span>
        </div>
        <div className="text-right">
          <span className="label-mono block">FLEET STATUS</span>
          <span className="text-primary">OPTIMAL · ALL SYSTEMS GO</span>
        </div>
      </div>
    </main>
  );
}

function Clock({ tick }: { tick: number }) {
  const d = new Date();
  void tick;
  return <span>{d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>;
}

function Bracket({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const map = {
    tl: "left-6 top-6 border-l border-t",
    tr: "right-6 top-6 border-r border-t",
    bl: "left-6 bottom-6 border-l border-b",
    br: "right-6 bottom-6 border-r border-b",
  };
  return <span className={`absolute z-10 h-10 w-10 border-primary/40 ${map[pos]}`} />;
}

function SkiHologram() {
  return (
    <svg viewBox="0 0 600 600" className="h-[60vh] w-[60vh] opacity-30">
      <defs>
        <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.16 165)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="oklch(0.85 0.12 200)" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <g transform="translate(300 300) rotate(-22)">
        <ellipse cx="0" cy="-180" rx="22" ry="40" fill="none" stroke="url(#hg)" strokeWidth="1" />
        <rect
          x="-22"
          y="-180"
          width="44"
          height="360"
          rx="22"
          fill="none"
          stroke="url(#hg)"
          strokeWidth="1.2"
        />
        <ellipse cx="0" cy="180" rx="22" ry="40" fill="none" stroke="url(#hg)" strokeWidth="1" />
        {Array.from({ length: 24 }).map((_, i) => (
          <line
            key={i}
            x1="-18"
            y1={-170 + i * 15}
            x2="18"
            y2={-170 + i * 15}
            stroke="oklch(0.78 0.16 165 / 0.18)"
            strokeWidth="0.6"
          />
        ))}
      </g>
    </svg>
  );
}
