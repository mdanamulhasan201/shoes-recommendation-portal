"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Nav } from "@/ski-rental/components/Nav";
import { Particles } from "@/ski-rental/components/Particles";
import { MatchRadar } from "@/ski-rental/components/MatchRadar";
import { SkierAvatar } from "@/ski-rental/components/SkierAvatar";
import { BootFit } from "@/ski-rental/components/BootFit";
import { EditAnswers } from "@/ski-rental/components/EditAnswers";
import { updatePerson, useGroup } from "@/ski-rental/lib/session";
import { assetSrc } from "@/ski-rental/lib/utils";
import skiImg from "@/ski-rental/assets/product-ski.png";
import bootImg from "@/ski-rental/assets/product-boot.png";
import helmetImg from "@/ski-rental/assets/product-helmet.png";
import polesImg from "@/ski-rental/assets/product-poles.png";

const COLOR_OPTIONS = [
  { k: "Any", v: "transparent" },
  { k: "Black", v: "oklch(0.18 0.008 240)" },
  { k: "Emerald", v: "oklch(0.78 0.16 165)" },
  { k: "Ice", v: "oklch(0.85 0.12 200)" },
  { k: "White", v: "oklch(0.96 0.005 200)" },
  { k: "Crimson", v: "oklch(0.65 0.22 25)" },
];

function ColorFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <span className="label-mono mr-2 text-muted-foreground">// COLOUR · OPTIONAL</span>
      {COLOR_OPTIONS.map((c) => (
        <button
          key={c.k}
          onClick={() => onChange(c.k)}
          className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition ${
            value === c.k
              ? "border-primary/60 bg-primary/10"
              : "border-white/10 bg-white/[0.03] hover:border-primary/30"
          }`}
        >
          <span
            className="h-3 w-3 rounded-full border border-white/20"
            style={{
              background:
                c.k === "Any"
                  ? "linear-gradient(135deg, oklch(0.78 0.16 165), oklch(0.65 0.22 25))"
                  : c.v,
            }}
          />
          <span className="font-mono text-[10px] tracking-[0.2em]">{c.k.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}

type Phase = "boot" | "ski" | "additions" | "compatibility" | "summary";
type Boot = {
  id: string;
  name: string;
  brand: string;
  tag: string;
  match: number;
  scores: {
    Comfort: number;
    Precision: number;
    Stability: number;
    Warmth: number;
    Terrain: number;
  };
  size: string;
  flex: string;
  why: string[];
};
type Ski = {
  id: string;
  name: string;
  brand: string;
  tag: string;
  match: number;
  metrics: {
    Stability: number;
    Forgiveness: number;
    Speed: number;
    Precision: number;
    Terrain: number;
    Comfort: number;
  };
  length: string;
  profile: string;
  why: string[];
};

const BOOTS: Boot[] = [
  {
    id: "BO-1183",
    brand: "Lange",
    name: "RS 130 LV",
    tag: "RACE FIT",
    match: 96,
    scores: { Comfort: 78, Precision: 96, Stability: 94, Warmth: 70, Terrain: 86 },
    size: "27.5 · last 97mm",
    flex: "Flex 130 · custom-shimmed",
    why: [
      "Race-fit liner matches your narrow heel",
      "Pronation +1.4° corrected by 3° canting",
      "All-day comfort confirmed by pressure map",
    ],
  },
  {
    id: "BO-1190",
    brand: "Tecnica",
    name: "Mach1 LV 120",
    tag: "ADVANCED PISTE",
    match: 92,
    scores: { Comfort: 88, Precision: 88, Stability: 90, Warmth: 82, Terrain: 88 },
    size: "27.0 · last 98mm",
    flex: "Flex 120 · C.A.S. shell",
    why: [
      "Heat-mouldable shell for biomechanical signature",
      "Balanced flex for sporty carving",
      "Warmer liner for −8°C forecast",
    ],
  },
  {
    id: "BO-1244",
    brand: "Atomic",
    name: "Hawx Prime 120",
    tag: "ALL-DAY COMFORT",
    match: 89,
    scores: { Comfort: 94, Precision: 82, Stability: 86, Warmth: 86, Terrain: 90 },
    size: "27.5 · last 100mm",
    flex: "Flex 120 · Mimic Platinum",
    why: [
      "Wider last for forefoot volume",
      "Memory liner for long sessions",
      "Versatile across pistes & soft snow",
    ],
  },
  {
    id: "BO-1305",
    brand: "Salomon",
    name: "S/Pro 120",
    tag: "PRECISION COMFORT",
    match: 84,
    scores: { Comfort: 90, Precision: 84, Stability: 84, Warmth: 84, Terrain: 86 },
    size: "27.5 · last 98mm",
    flex: "Flex 120 · Coreframe",
    why: [
      "Excellent transmission for intermediate-advanced",
      "Light · easy in/out",
      "Suits your medium-aggressive style",
    ],
  },
];

const SKIS: Ski[] = [
  {
    id: "SK-0421",
    brand: "Atomic",
    name: "Redster G9 RS",
    tag: "RACE CARVING",
    match: 94,
    metrics: { Stability: 96, Forgiveness: 48, Speed: 96, Precision: 95, Terrain: 78, Comfort: 62 },
    length: "168 cm · R 13.5",
    profile: "Cambered race",
    why: [
      "Optimised for medium/high speed carving",
      "Perfect for groomed pistes",
      "Matches your sporty riding profile",
    ],
  },
  {
    id: "SK-0501",
    brand: "Völkl",
    name: "Mantra M7",
    tag: "ALL MOUNTAIN",
    match: 90,
    metrics: { Stability: 86, Forgiveness: 74, Speed: 84, Precision: 82, Terrain: 92, Comfort: 78 },
    length: "177 cm · R 19",
    profile: "Tip rocker / camber",
    why: [
      "Versatile across pistes and soft snow",
      "Forgiving for variable conditions",
      "Stable at speed",
    ],
  },
  {
    id: "SK-0388",
    brand: "Rossignol",
    name: "Hero Elite ST Ti",
    tag: "TECHNICAL CARVING",
    match: 87,
    metrics: { Stability: 92, Forgiveness: 60, Speed: 90, Precision: 92, Terrain: 76, Comfort: 70 },
    length: "165 cm · R 12",
    profile: "Full camber",
    why: [
      "Razor-sharp edge hold on hardpack",
      "Great for short, dynamic turns",
      "Advanced piste DNA",
    ],
  },
  {
    id: "SK-0567",
    brand: "Salomon",
    name: "QST 106",
    tag: "FREERIDE",
    match: 81,
    metrics: { Stability: 78, Forgiveness: 88, Speed: 76, Precision: 70, Terrain: 95, Comfort: 84 },
    length: "181 cm · R 17",
    profile: "All-mountain rocker",
    why: [
      "Floats powder · holds the line on hardpack",
      "Forgiving under foot fatigue",
      "Best for soft-snow days",
    ],
  },
];

const ADDITIONS = [
  {
    id: "helmet",
    title: "Helmet",
    price: 9,
    why: "Recommended for advanced piste & speed",
    img: helmetImg,
  },
  {
    id: "poles",
    title: "Ski poles",
    price: 6,
    why: "Carbon — matches your race-carving setup",
    img: polesImg,
  },
  {
    id: "both",
    title: "Helmet + poles",
    price: 13,
    why: "AI default for your profile",
    img: helmetImg,
  },
  {
    id: "none",
    title: "No additional equipment",
    price: 0,
    why: "You'll bring your own",
    img: null,
  },
];

export default function ResultsPage() {
  return (
    <Suspense fallback={<ScanGenerating />}>
      <Results />
    </Suspense>
  );
}

function Results() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") ?? "rental";
  const pid = searchParams.get("pid") ?? "";
  const router = useRouter();
  const g = useGroup();
  const person =
    g.people.find((p) => p.id === pid) ??
    g.people.find((p) => p.id === g.activePersonId) ??
    g.people[0];
  const [generated, setGenerated] = useState(false);
  const [phase, setPhase] = useState<Phase>("boot");
  const [boot, setBoot] = useState<Boot | null>(null);
  const [ski, setSki] = useState<Ski | null>(null);
  const [add, setAdd] = useState<string>("both");
  const [compat, setCompat] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setGenerated(true), 2200);
    return () => clearTimeout(t);
  }, []);

  // animate compatibility number when reaching that phase
  useEffect(() => {
    if (phase !== "compatibility") return;
    setCompat(0);
    let v = 0;
    const id = setInterval(() => {
      v += 2;
      if (v >= 97) {
        clearInterval(id);
        setCompat(97);
        setTimeout(() => setPhase("summary"), 900);
      } else setCompat(v);
    }, 28);
    return () => clearInterval(id);
  }, [phase]);

  if (!generated) return <ScanGenerating />;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <Nav />
      <div className="absolute inset-0 bg-grid opacity-30" />
      <Particles density={50} />
      <div className="absolute inset-x-0 top-0 h-[55vh] bg-[radial-gradient(circle_at_50%_0%,oklch(0.78_0.16_165/0.10),transparent_70%)]" />

      <section className="relative mx-auto max-w-7xl px-6 pt-28 pb-20">
        <PhaseRail current={phase} hasBoot={!!boot} hasSki={!!ski} />

        <AnimatePresence mode="wait">
          {phase === "boot" && (
            <motion.div
              key="boot"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <Header
                kicker="STEP 01 · AI CURATED · 4 MATCHES"
                title={
                  <>
                    {person ? person.first + "'s" : "Your"} best matching{" "}
                    <span className="text-emerald-gradient">ski boots.</span>
                  </>
                }
                sub="Hand-picked from 312 boots in stock. Tap to compare. Choose the one that feels right."
              />
              <ColorFilter
                value={person?.color || "Any"}
                onChange={(v) => person && updatePerson(person.id, { color: v })}
              />
              <BootPicker boots={BOOTS} selected={boot} onSelect={setBoot} />
              <Footer
                disabled={!boot}
                onNext={() => setPhase("ski")}
                nextLabel="SELECT THIS BOOT →"
              />
            </motion.div>
          )}

          {phase === "ski" && (
            <motion.div
              key="ski"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <Header
                kicker="STEP 02 · AI CURATED · 4 MATCHES"
                title={
                  <>
                    Your best matching <span className="text-emerald-gradient">skis.</span>
                  </>
                }
                sub={`Re-ranked against ${boot?.brand} ${boot?.name}. Each option is fully compatible.`}
              />
              <ColorFilter
                value={person?.color || "Any"}
                onChange={(v) => person && updatePerson(person.id, { color: v })}
              />
              <SkiPicker skis={SKIS} selected={ski} onSelect={setSki} />
              <Footer
                onBack={() => setPhase("boot")}
                disabled={!ski}
                onNext={() => setPhase("additions")}
                nextLabel="SELECT THIS SKI →"
              />
            </motion.div>
          )}

          {phase === "additions" && (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <Header
                kicker="STEP 03 · OPTIONAL ADDITIONS"
                title={
                  <>
                    Your setup is <span className="text-emerald-gradient">almost complete.</span>
                  </>
                }
                sub="The AI suggests adding helmet + poles for icy conditions and your aggressive riding profile."
              />
              <AdditionsGrid value={add} onChange={setAdd} />
              <Footer
                onBack={() => setPhase("ski")}
                onNext={() => setPhase("compatibility")}
                nextLabel="CONFIRM SETUP →"
              />
            </motion.div>
          )}

          {phase === "compatibility" && boot && ski && (
            <motion.div
              key="comp"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20"
            >
              <CompatibilityScreen boot={boot} ski={ski} value={compat} />
            </motion.div>
          )}

          {phase === "summary" && boot && ski && (
            <motion.div key="sum" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <Header
                kicker={`// ${person ? person.first.toUpperCase() + "'S " : ""}ENGINEERED SETUP`}
                title={
                  <>
                    Your <span className="text-emerald-gradient">perfect setup</span> is engineered.
                  </>
                }
                sub="Generated from 47 biomechanical signals and 3.2M ride profiles."
              />

              {/* IMMERSIVE AVATAR + BOOT FIT */}
              <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                <div className="glass-strong rounded-3xl p-8">
                  <span className="label-mono text-primary">// SKIER VISUALIZATION</span>
                  <h3 className="mt-2 font-display text-2xl font-semibold">
                    {ski.length} on a {person?.height ?? 180} cm body
                  </h3>
                  <div className="mt-6 flex justify-center">
                    <SkierAvatar
                      height={person?.height ?? (person?.kind === "child" ? 130 : 180)}
                      skiLength={parseInt(ski.length) || 168}
                      kid={person?.kind === "child"}
                    />
                  </div>
                </div>
                <div className="glass-strong rounded-3xl p-8">
                  <span className="label-mono text-primary">// 3D BOOT FIT</span>
                  <h3 className="mt-2 font-display text-2xl font-semibold">
                    {boot.brand} {boot.name}
                  </h3>
                  <div className="mt-6">
                    <BootFit />
                  </div>
                </div>
              </div>

              <Summary
                boot={boot}
                ski={ski}
                add={add}
                mode={mode}
                onConfirm={() => {
                  if (person)
                    updatePerson(person.id, {
                      bootName: `${boot.brand} ${boot.name}`,
                      skiName: `${ski.brand} ${ski.name}`,
                      skiLength: parseInt(ski.length) || 168,
                      done: true,
                    });
                  router.push("/ski-rental/group");
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-16 flex justify-between">
          <Link href="/ski-rental/group" className="label-mono hover:text-foreground">
            ← BACK TO GROUP
          </Link>
          <Link href="/ski-rental/start" className="label-mono hover:text-foreground">
            OPEN OPERATIONS →
          </Link>
        </div>
      </section>
      <EditAnswers />
    </main>
  );
}

// ───────── shared layout ─────────
function Header({ kicker, title, sub }: { kicker: string; title: React.ReactNode; sub: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <span className="label-mono text-primary">// {kicker}</span>
      <h1 className="mt-3 max-w-4xl font-display text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{sub}</p>
    </motion.div>
  );
}

function Footer({
  onBack,
  onNext,
  disabled,
  nextLabel,
}: {
  onBack?: () => void;
  onNext: () => void;
  disabled?: boolean;
  nextLabel: string;
}) {
  return (
    <div className="mt-12 flex items-center justify-between gap-6 rounded-2xl glass px-6 py-5">
      <button
        onClick={onBack}
        disabled={!onBack}
        className={`label-mono ${onBack ? "hover:text-foreground" : "opacity-30"}`}
      >
        ← BACK
      </button>
      <button
        onClick={onNext}
        disabled={disabled}
        className={`group relative inline-flex items-center gap-3 rounded-full px-10 py-5 text-sm font-semibold tracking-[0.3em] transition ${
          disabled
            ? "bg-white/5 text-muted-foreground"
            : "bg-primary text-primary-foreground hover:shadow-[0_0_60px_oklch(0.78_0.16_165/0.6)]"
        }`}
      >
        {!disabled && (
          <span className="absolute inset-0 rounded-full bg-primary/40 blur-xl opacity-0 transition group-hover:opacity-100" />
        )}
        <span className="relative">{nextLabel}</span>
      </button>
    </div>
  );
}

function PhaseRail({
  current,
  hasBoot,
  hasSki,
}: {
  current: Phase;
  hasBoot: boolean;
  hasSki: boolean;
}) {
  const steps: { k: Phase; n: string; l: string }[] = [
    { k: "boot", n: "01", l: "Boots" },
    { k: "ski", n: "02", l: "Skis" },
    { k: "additions", n: "03", l: "Additions" },
    { k: "summary", n: "04", l: "Setup" },
  ];
  const idx = (k: Phase) => steps.findIndex((s) => s.k === k);
  const currentIdx = current === "compatibility" ? 3 : idx(current);
  return (
    <div className="mb-10 flex flex-wrap items-center gap-3">
      {steps.map((s, i) => {
        const done =
          i < currentIdx ||
          (s.k === "boot" && hasBoot && current !== "boot") ||
          (s.k === "ski" && hasSki && current !== "ski");
        const active = i === currentIdx;
        return (
          <div key={s.k} className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${
                active
                  ? "border-primary/60 bg-primary/10"
                  : done
                    ? "border-primary/30 bg-primary/5"
                    : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${active ? "bg-primary glow-ring" : done ? "bg-primary" : "bg-white/30"}`}
              />
              <span className="label-mono">{s.n}</span>
              <span
                className={`font-mono text-xs ${active ? "text-foreground" : "text-muted-foreground"}`}
              >
                {s.l}
              </span>
            </div>
            {i < steps.length - 1 && <span className="h-px w-6 bg-white/10" />}
          </div>
        );
      })}
    </div>
  );
}

// ───────── boot picker ─────────
function BootPicker({
  boots,
  selected,
  onSelect,
}: {
  boots: Boot[];
  selected: Boot | null;
  onSelect: (b: Boot) => void;
}) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    onSelect(boots[active]); /* preselect */ /* eslint-disable-next-line */
  }, [active]);
  const b = boots[active];

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      {/* tabs */}
      <div className="space-y-3">
        {boots.map((bo, i) => (
          <button
            key={bo.id}
            onClick={() => setActive(i)}
            className={`group relative w-full overflow-hidden rounded-2xl p-5 text-left transition ${
              i === active
                ? "glass-strong border-primary/50 shadow-[0_0_50px_oklch(0.78_0.16_165/0.18)]"
                : "glass hover:border-primary/20"
            }`}
            style={i === active ? { borderColor: "oklch(0.78 0.16 165 / 0.5)" } : {}}
          >
            <div className="flex items-center justify-between">
              <span className="label-mono">{bo.tag}</span>
              <span className={`label-mono ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>
                {i === 0 ? "AI TOP PICK" : `OPTION 0${i + 1}`}
              </span>
            </div>
            <div className="mt-2 font-display text-xl font-semibold">
              {bo.brand} {bo.name}
            </div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">
              {bo.size} · {bo.flex}
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="font-mono text-3xl font-semibold text-emerald-gradient leading-none">
                  {bo.match}
                </div>
                <div className="label-mono mt-1">% MATCH</div>
              </div>
              {i === active && <span className="h-2 w-2 rounded-full bg-primary glow-ring" />}
            </div>
          </button>
        ))}
      </div>

      {/* detail card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={b.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.45 }}
          className="glass-strong relative overflow-hidden rounded-3xl p-8"
        >
          <div className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary glow-ring" />
            <span className="label-mono text-primary">SELECTED</span>
          </div>

          <div className="grid items-center gap-6 md:grid-cols-[1fr_1.4fr]">
            <motion.div
              key={`bootimg-${b.id}`}
              initial={{ opacity: 0, scale: 0.85, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex aspect-square items-center justify-center"
            >
              <div className="absolute inset-4 rounded-full bg-[radial-gradient(circle,oklch(0.78_0.16_165/0.25),transparent_70%)] blur-2xl" />
              {[0, 1].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-2 rounded-full border border-primary/20"
                  style={{ inset: i * 16 + 8 }}
                  animate={{ rotate: i % 2 ? 360 : -360 }}
                  transition={{ duration: 24 + i * 6, repeat: Infinity, ease: "linear" }}
                />
              ))}
              <img
                src={assetSrc(bootImg)}
                alt={`${b.brand} ${b.name}`}
                loading="lazy"
                className="relative z-10 max-h-[260px] w-auto drop-shadow-[0_25px_50px_oklch(0.78_0.16_165/0.35)]"
              />
              <span className="absolute bottom-2 left-2 rounded-full border border-primary/40 bg-background/70 px-3 py-1 label-mono text-primary backdrop-blur">
                LIVE FIT PREVIEW
              </span>
            </motion.div>
            <div>
              <span className="label-mono">{b.tag}</span>
              <div className="mt-2 font-display text-3xl font-semibold tracking-tight">
                {b.brand} {b.name}
              </div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">
                {b.size} · {b.flex}
              </div>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
                <span className="font-mono text-2xl text-emerald-gradient">{b.match}%</span>
                <span className="label-mono">MATCH</span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div>
              <span className="label-mono">// AI TELEMETRY</span>
              <div className="mt-4 space-y-3">
                {Object.entries(b.scores).map(([k, v], i) => (
                  <ScoreBar key={k} k={k} v={v} delay={i * 0.06} />
                ))}
              </div>
            </div>
            <div>
              <span className="label-mono">// WHY THIS FITS YOU</span>
              <ul className="mt-4 space-y-3">
                {b.why.map((w, i) => (
                  <motion.li
                    key={w}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex gap-3 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary glow-ring" />
                    {w}
                  </motion.li>
                ))}
              </ul>
              <div className="mt-8 grid grid-cols-3 gap-3">
                <KPI l="MATCH" v={`${b.match}%`} />
                <KPI l="CONFIDENCE" v="HIGH" />
                <KPI l="IN STOCK" v="3" />
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ───────── ski picker ─────────
function SkiPicker({
  skis,
  selected,
  onSelect,
}: {
  skis: Ski[];
  selected: Ski | null;
  onSelect: (s: Ski) => void;
}) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    onSelect(skis[active]); /* eslint-disable-next-line */
  }, [active]);
  const s = skis[active];

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <AnimatePresence mode="wait">
        <motion.div
          key={s.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="glass-strong relative overflow-hidden rounded-3xl p-8"
        >
          <div className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary glow-ring" />
            <span className="label-mono text-primary">SELECTED</span>
          </div>

          <span className="label-mono">{s.tag}</span>
          <div className="mt-2 font-display text-4xl font-semibold tracking-tight">
            {s.brand} {s.name}
          </div>
          <div className="mt-1 font-mono text-xs text-muted-foreground">
            {s.length} · {s.profile}
          </div>

          {/* large ski image with cinematic slide-in */}
          <motion.div
            key={`skiimg-${s.id}`}
            initial={{ opacity: 0, x: -120, rotate: -2 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-6 flex h-[120px] items-center"
          >
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <img
              src={assetSrc(skiImg)}
              alt={`${s.brand} ${s.name}`}
              loading="lazy"
              className="relative z-10 h-[120px] w-full object-contain drop-shadow-[0_18px_30px_oklch(0.78_0.16_165/0.35)]"
            />
            <span className="absolute right-2 top-2 rounded-full border border-primary/40 bg-background/70 px-3 py-1 label-mono text-primary backdrop-blur">
              {s.length}
            </span>
          </motion.div>

          <div className="mt-6 grid items-center gap-8 md:grid-cols-[1fr_1fr]">
            <div className="relative h-[260px]">
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,oklch(0.78_0.16_165/0.15),transparent_70%)]" />
              <MatchRadar metrics={s.metrics} />
            </div>
            <div>
              <div className="font-mono text-7xl font-semibold text-emerald-gradient leading-none">
                {s.match}
              </div>
              <div className="label-mono mt-2">% COMPATIBILITY</div>
              <ul className="mt-6 space-y-3">
                {s.why.map((w) => (
                  <li key={w} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary glow-ring" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {Object.entries(s.metrics)
              .slice(0, 3)
              .map(([k, v]) => (
                <ScoreBar key={k} k={k} v={v} />
              ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="space-y-3">
        {skis.map((sk, i) => (
          <button
            key={sk.id}
            onClick={() => setActive(i)}
            className={`group relative w-full overflow-hidden rounded-2xl p-5 text-left transition ${
              i === active
                ? "glass-strong shadow-[0_0_50px_oklch(0.78_0.16_165/0.18)]"
                : "glass hover:border-primary/20"
            }`}
            style={i === active ? { borderColor: "oklch(0.78 0.16 165 / 0.5)" } : {}}
          >
            <div className="flex items-center justify-between">
              <span className="label-mono">{sk.tag}</span>
              <span className={`label-mono ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>
                {i === 0 ? "AI TOP PICK" : `OPTION 0${i + 1}`}
              </span>
            </div>
            <div className="mt-2 font-display text-xl font-semibold">
              {sk.brand} {sk.name}
            </div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">
              {sk.length} · {sk.profile}
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="font-mono text-3xl font-semibold text-emerald-gradient leading-none">
                  {sk.match}
                </div>
                <div className="label-mono mt-1">% MATCH</div>
              </div>
              {i === active && <span className="h-2 w-2 rounded-full bg-primary glow-ring" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ───────── additions ─────────
function AdditionsGrid({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {ADDITIONS.map((a, i) => {
        const active = value === a.id;
        const recommended = a.id === "both";
        return (
          <motion.button
            key={a.id}
            onClick={() => onChange(a.id)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`group relative overflow-hidden rounded-3xl p-8 text-left transition-all ${
              active
                ? "glass-strong border-primary/60 shadow-[0_0_60px_oklch(0.78_0.16_165/0.25)]"
                : "glass hover:border-primary/30 hover:-translate-y-1"
            }`}
            style={{
              minHeight: 280,
              borderColor: active ? "oklch(0.78 0.16 165 / 0.6)" : undefined,
            }}
          >
            {recommended && (
              <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 label-mono text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary glow-ring" />
                AI RECOMMENDS
              </span>
            )}
            <div className="relative flex h-32 items-center justify-center">
              <div className="absolute inset-x-6 top-1/2 h-20 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,oklch(0.78_0.16_165/0.2),transparent_70%)] blur-xl" />
              {a.img ? (
                <img
                  src={assetSrc(a.img)}
                  alt={a.title}
                  loading="lazy"
                  className="relative max-h-32 w-auto drop-shadow-[0_15px_30px_oklch(0.78_0.16_165/0.4)]"
                />
              ) : (
                <div className="font-display text-6xl text-muted-foreground">—</div>
              )}
            </div>
            <div className="mt-8 font-display text-2xl font-semibold">{a.title}</div>
            <div className="mt-2 text-sm text-muted-foreground">{a.why}</div>
            <div className="mt-6 flex items-end justify-between">
              <span className="label-mono">{a.price > 0 ? `+ €${a.price}/day` : "INCLUDED"}</span>
              {active && <span className="label-mono text-primary">SELECTED ✓</span>}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

// ───────── compatibility / synthesis ─────────
function CompatibilityScreen({ boot, ski, value }: { boot: Boot; ski: Ski; value: number }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="label-mono text-primary">// AI COMPATIBILITY SYNTHESIS</span>
      <div className="mt-8 relative">
        <div className="relative h-72 w-72">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border border-primary/30"
              style={{ inset: i * 18 }}
              animate={{ rotate: i % 2 ? 360 : -360 }}
              transition={{ duration: 16 + i * 4, repeat: Infinity, ease: "linear" }}
            />
          ))}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-mono text-7xl font-semibold text-emerald-gradient">{value}%</div>
            <div className="label-mono mt-2">COMPATIBLE</div>
          </div>
        </div>
      </div>
      <div className="mt-10 max-w-xl text-lg text-muted-foreground">
        Cross-validating{" "}
        <span className="text-foreground">
          {boot.brand} {boot.name}
        </span>{" "}
        against{" "}
        <span className="text-foreground">
          {ski.brand} {ski.name}
        </span>
        …
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-2 font-mono text-xs text-muted-foreground">
        {[
          "Flex transmission",
          "Edge response",
          "Boot binding interface",
          "Ride profile alignment",
        ].map((t, i) => (
          <motion.span
            key={t}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.25 }}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
          >
            · {t}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

// ───────── final summary ─────────
function Summary({
  boot,
  ski,
  add,
  mode,
  onConfirm,
}: {
  boot: Boot;
  ski: Ski;
  add: string;
  mode: string;
  onConfirm: () => void;
}) {
  const days = 3;
  const base = 49;
  const addPrice = ADDITIONS.find((a) => a.id === add)?.price ?? 0;
  const total = (base + addPrice) * days;

  const items = useMemo(() => {
    const arr = [
      { c: "BOOTS", n: `${boot.brand} ${boot.name}`, m: boot.size },
      { c: "SKIS", n: `${ski.brand} ${ski.name}`, m: ski.length },
    ];
    if (add === "helmet" || add === "both")
      arr.push({ c: "HELMET", n: "Smith Vantage MIPS", m: "M · disinfected" });
    if (add === "poles" || add === "both")
      arr.push({ c: "POLES", n: "Leki WCR Lite SL", m: "120 cm · carbon" });
    return arr;
  }, [boot, ski, add]);

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="glass-strong rounded-3xl p-8">
        <div className="flex items-center justify-between">
          <span className="label-mono">// YOUR ENGINEERED SETUP</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary glow-ring" />
            <span className="label-mono text-primary">97% COMPATIBLE</span>
          </span>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {items.map((it, i) => (
            <motion.div
              key={it.c}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
            >
              <span className="label-mono">{it.c}</span>
              <div className="mt-2 font-display text-lg font-semibold">{it.n}</div>
              <div className="font-mono text-xs text-muted-foreground">{it.m}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="glass-strong rounded-3xl p-8 flex flex-col">
        <span className="label-mono">// RESERVATION</span>
        <div className="mt-3 font-display text-3xl font-semibold leading-tight">
          Ready for pickup.
        </div>
        <div className="mt-1 text-muted-foreground">
          Pickup QR + queue number activate at confirm.
        </div>

        <div className="mt-8 flex items-end justify-between">
          <div>
            <span className="label-mono">TOTAL · {days} DAYS</span>
            <div className="mt-1 font-display text-5xl font-semibold">€ {total.toFixed(0)}</div>
            <div className="font-mono text-xs text-muted-foreground">
              € {base + addPrice}/day · all-in
            </div>
          </div>
        </div>

        <button
          onClick={onConfirm}
          className="group relative mt-auto inline-flex w-full items-center justify-center gap-3 rounded-full bg-primary px-8 py-5 text-sm font-semibold tracking-[0.3em] text-primary-foreground"
        >
          <span className="absolute inset-0 rounded-full bg-primary/40 blur-xl opacity-0 transition group-hover:opacity-100" />
          <span className="relative">CONFIRM RESERVATION →</span>
        </button>
        <div className="mt-3 text-center font-mono text-[10px] text-muted-foreground">
          {mode === "rental" ? "Encrypted · 3-D Secure · No card hold" : ""}
        </div>
      </div>
    </div>
  );
}

// ───────── primitives ─────────
function ScoreBar({ k, v, delay = 0 }: { k: string; v: number; delay?: number }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between">
        <span className="label-mono">{k}</span>
        <span className="font-mono text-xs">{v}</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 1, delay, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent"
          style={{ boxShadow: "0 0 14px oklch(0.78 0.16 165 / 0.6)" }}
        />
      </div>
    </div>
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

function ScanGenerating() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <Particles density={80} />
      <div className="relative flex flex-col items-center">
        <div className="relative h-72 w-72">
          <div className="absolute inset-0 rounded-full border border-primary/30" />
          <div className="absolute inset-6 rounded-full border border-primary/20" />
          <div className="absolute inset-12 rounded-full border border-primary/10" />
          <div
            className="absolute inset-0 animate-spin rounded-full border-t-2 border-primary"
            style={{ animationDuration: "3s" }}
          />
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className="absolute inset-x-0 h-1 bg-gradient-to-b from-primary/80 to-transparent animate-scan" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="label-mono text-primary">CURATING</span>
          </div>
        </div>
        <div className="mt-12 space-y-2 text-center font-mono text-xs text-muted-foreground">
          <Line t="biomechanical signature" /> <Line t="ride profile synthesis" delay={0.4} />
          <Line t="cross-matching 312 boots · 184 skis" delay={0.8} />{" "}
          <Line t="compatibility engine" delay={1.2} />
          <Line t="curating top 4" delay={1.6} />
        </div>
      </div>
    </main>
  );
}
function Line({ t, delay = 0 }: { t: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-2 justify-center"
    >
      <span className="h-1 w-1 rounded-full bg-primary glow-ring" /> {t}…
    </motion.div>
  );
}
