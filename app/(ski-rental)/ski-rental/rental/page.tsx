"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Particles } from "@/ski-rental/components/Particles";
import { QuestionShell, ChoiceCard } from "@/ski-rental/components/flow/QuestionShell";
import { addPerson, updatePerson, useGroup, type Person } from "@/ski-rental/lib/session";

export default function Rental() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pid = searchParams.get("pid") ?? "";
  const g = useGroup();

  useEffect(() => {
    if (g.people.length === 0) {
      addPerson({
        first: "Guest",
        last: "Rider",
        email: "guest@feetfirst.local",
        kind: "adult",
        gender: "Prefer not to say",
      });
    }
  }, [g.people.length]);

  const person = useMemo<Person | undefined>(
    () =>
      g.people.find((p) => p.id === pid) ??
      g.people.find((p) => p.id === g.activePersonId) ??
      g.people[0],
    [g.people, g.activePersonId, pid],
  );

  const isKid = person?.kind === "child";
  // Adult: Body, Scan, Skill, Ride, Terrain, Priority, Tier  → 7
  // Kid:   Body, Scan, Skill, Comfort, Ready                 → 5
  const STEPS = isKid ? 5 : 7;
  const [step, setStep] = useState(1);

  if (!person) return null;
  const set = (patch: Partial<Person>) => updatePerson(person.id, patch);

  const next = () => {
    if (step < STEPS) setStep(step + 1);
    else {
      updatePerson(person.id, { done: true });
      router.push(`/ski-rental/results?pid=${encodeURIComponent(person.id)}`);
    }
  };
  const back = step > 1 ? () => setStep(step - 1) : () => router.push("/ski-rental/group");

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <Particles density={40} />
      <div className="absolute inset-x-0 top-0 h-[60vh] bg-[radial-gradient(circle_at_50%_0%,oklch(0.78_0.16_165/0.10),transparent_70%)]" />

      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 pt-8">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full border ${
              isKid
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-primary/40 bg-primary/10 text-primary"
            }`}
          >
            {isKid ? "★" : person.first[0]?.toUpperCase()}
          </div>
          <div>
            <div className="font-display text-lg font-semibold leading-tight">
              {person.first} {person.last}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground">
              {isKid ? `KIDS PROFILE · AGE ${person.age ?? "—"}` : "ADULT PROFILE"} · STEP {step}/
              {STEPS}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push("/ski-rental/group")}
          className="label-mono hover:text-foreground"
        >
          ← GROUP
        </button>
      </header>

      <div className="relative">
        {/* STEP 1 — BODY: height + weight */}
        {step === 1 && (
          <BodyStep
            step={1}
            total={STEPS}
            kid={isKid}
            height={person.height}
            weight={person.weight}
            onChange={(h, w) => set({ height: h, weight: w })}
            onBack={back}
            onNext={next}
            disabled={!person.height || !person.weight}
          />
        )}

        {/* STEP 2 — SCAN */}
        {step === 2 && (
          <ScanStep
            step={2}
            total={STEPS}
            kid={isKid}
            onComplete={() => {
              set({ scanned: true });
              setStep(3);
            }}
            onBack={back}
          />
        )}

        {/* STEP 3 — SKILL */}
        {!isKid && step === 3 && (
          <QuestionShell
            step={3}
            total={STEPS}
            kicker="// SKILL CALIBRATION"
            title="How experienced are you?"
            onBack={back}
            onNext={next}
            nextDisabled={!person.level}
          >
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { l: "Beginner", d: "First seasons. Building confidence." },
                { l: "Intermediate", d: "Comfortable on most pistes." },
                { l: "Advanced", d: "Carving with control & speed." },
                { l: "Expert", d: "All terrain. Race & freeride." },
              ].map((o) => (
                <ChoiceCard
                  key={o.l}
                  label={o.l}
                  desc={o.d}
                  active={person.level === o.l}
                  onClick={() => set({ level: o.l })}
                />
              ))}
            </div>
          </QuestionShell>
        )}

        {isKid && step === 3 && (
          <QuestionShell
            step={3}
            total={STEPS}
            kicker="// LITTLE RIDER"
            title="How much have they skied before?"
            onBack={back}
            onNext={next}
            nextDisabled={!person.level}
          >
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { l: "First time ⛄", d: "Brand new to snow" },
                { l: "Some lessons 🌟", d: "Can snowplow / pizza" },
                { l: "Confident 🚀", d: "Linking turns on green/blue" },
              ].map((o) => (
                <ChoiceCard
                  key={o.l}
                  label={o.l}
                  desc={o.d}
                  active={person.level === o.l}
                  onClick={() => set({ level: o.l })}
                />
              ))}
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              The AI prioritises softer flex, warmer liners and easy-control skis for kids —
              automatically.
            </p>
          </QuestionShell>
        )}

        {/* STEP 4 — RIDE / COMFORT */}
        {!isKid && step === 4 && (
          <QuestionShell
            step={4}
            total={STEPS}
            kicker="// RIDE STYLE"
            title="How do you want it to feel?"
            onBack={back}
            onNext={next}
            nextDisabled={!person.ride}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {[
                "Comfortable & forgiving",
                "Balanced & versatile",
                "Sporty & precise",
                "Aggressive & race-oriented",
              ].map((o) => (
                <ChoiceCard
                  key={o}
                  label={o}
                  active={person.ride === o}
                  onClick={() => set({ ride: o })}
                />
              ))}
            </div>
          </QuestionShell>
        )}

        {isKid && step === 4 && (
          <QuestionShell
            step={4}
            total={STEPS}
            kicker="// COMFORT FIRST"
            title="What feels best for them?"
            onBack={back}
            onNext={next}
            nextDisabled={!person.ride}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {["Super warm 🔥", "Easy to turn 🌀", "Soft and comfy 🛋", "Bright colours 🌈"].map(
                (o) => (
                  <ChoiceCard
                    key={o}
                    label={o}
                    active={person.ride === o}
                    onClick={() => set({ ride: o })}
                  />
                ),
              )}
            </div>
          </QuestionShell>
        )}

        {/* STEP 5 — TERRAIN (adult) / READY (kid) */}
        {!isKid && step === 5 && (
          <QuestionShell
            step={5}
            total={STEPS}
            kicker="// TERRAIN"
            title="Where do you ski?"
            onBack={back}
            onNext={next}
            nextDisabled={!person.terrain}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {["Groomed pistes", "All mountain", "Powder / freeride", "Park & freestyle"].map(
                (o) => (
                  <ChoiceCard
                    key={o}
                    label={o}
                    active={person.terrain === o}
                    onClick={() => set({ terrain: o })}
                  />
                ),
              )}
            </div>
          </QuestionShell>
        )}

        {isKid && step === 5 && (
          <QuestionShell
            step={5}
            total={STEPS}
            kicker="// READY"
            title="Awesome — setup time! 🎿"
            onBack={back}
            onNext={next}
            nextLabel="GENERATE KIDS SETUP →"
          >
            <div className="glass-strong rounded-2xl p-8">
              <p className="text-lg">
                The AI will pick the safest, warmest, most fun setup for {person.first} — with
                shorter skis, soft flex, and easy-control boots.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                <li>· Helmet always included for kids</li>
                <li>· Warmth-rated liners</li>
                <li>· Beginner-forgiving ski geometry</li>
              </ul>
            </div>
          </QuestionShell>
        )}

        {/* STEP 6 — PRIORITY (adult only) */}
        {!isKid && step === 6 && (
          <QuestionShell
            step={6}
            total={STEPS}
            kicker="// PRIORITY"
            title="What matters most?"
            onBack={back}
            onNext={next}
            nextDisabled={!person.matters}
          >
            <div className="grid gap-4 md:grid-cols-5">
              {["Comfort", "Stability", "Speed", "Precision", "Easy control"].map((o) => (
                <ChoiceCard
                  key={o}
                  label={o}
                  active={person.matters === o}
                  onClick={() => set({ matters: o })}
                />
              ))}
            </div>
          </QuestionShell>
        )}

        {/* STEP 7 — TIER (adult only) */}
        {!isKid && step === 7 && (
          <QuestionShell
            step={7}
            total={STEPS}
            kicker="// PERFORMANCE TIER"
            title="How premium?"
            onBack={back}
            onNext={next}
            nextDisabled={!person.tier}
            nextLabel="GENERATE SETUP →"
          >
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { l: "Essential", d: "Solid, reliable kit.", p: "€ 35/day" },
                { l: "Balanced", d: "Mainstream premium.", p: "€ 49/day" },
                { l: "Premium", d: "Top consumer line.", p: "€ 65/day" },
                { l: "Elite Performance", d: "Race & pro-tier.", p: "€ 89/day" },
              ].map((o) => (
                <button
                  key={o.l}
                  onClick={() => set({ tier: o.l })}
                  className={`group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 ${
                    person.tier === o.l
                      ? "border border-primary/60 bg-primary/10 shadow-[0_0_40px_oklch(0.78_0.16_165/0.25)]"
                      : "glass hover:border-primary/30 hover:-translate-y-0.5"
                  }`}
                >
                  {person.tier === o.l && (
                    <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-primary glow-ring" />
                  )}
                  <div className="font-display text-xl font-semibold">{o.l}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{o.d}</div>
                  <div className="mt-6 font-mono text-sm text-primary">{o.p}</div>
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Colour preferences live as a small filter on the next screen — performance is set
              first.
            </p>
          </QuestionShell>
        )}
      </div>

      <Slider />
    </main>
  );
}

// ───────── BODY STEP (height + weight) ─────────
function BodyStep({
  step,
  total,
  kid,
  height,
  weight,
  onChange,
  onBack,
  onNext,
  disabled,
}: {
  step: number;
  total: number;
  kid: boolean;
  height?: number;
  weight?: number;
  onChange: (h: number, w: number) => void;
  onBack?: () => void;
  onNext: () => void;
  disabled?: boolean;
}) {
  const [h, setH] = useState<number>(height ?? (kid ? 130 : 178));
  const [w, setW] = useState<number>(weight ?? (kid ? 30 : 75));

  useEffect(() => {
    onChange(h, w); /* eslint-disable-next-line */
  }, [h, w]);

  const heightPresets = kid ? [110, 125, 140, 155] : [165, 175, 180, 190];
  const weightPresets = kid ? [25, 35, 45, 55] : [60, 75, 85, 95];

  return (
    <QuestionShell
      step={step}
      total={total}
      kicker="// BODY METRICS"
      title={kid ? "How tall and how much do they weigh?" : "Your height and weight."}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={disabled}
      nextLabel="CONTINUE TO SCAN →"
    >
      <p className="-mt-2 mb-6 text-sm text-muted-foreground">
        The AI uses these to engineer ski length, binding DIN, flex profile, and 3D body
        proportions. Foot dimensions come from the next scan — no shoe size needed.
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        <NumberInput
          label="HEIGHT"
          unit="cm"
          value={h}
          setValue={setH}
          min={kid ? 90 : 140}
          max={kid ? 170 : 220}
          step={1}
          presets={heightPresets}
        />
        <NumberInput
          label="WEIGHT"
          unit="kg"
          value={w}
          setValue={setW}
          min={kid ? 15 : 40}
          max={kid ? 90 : 160}
          step={1}
          presets={weightPresets}
        />
      </div>
    </QuestionShell>
  );
}

function NumberInput({
  label,
  unit,
  value,
  setValue,
  min,
  max,
  step,
  presets,
}: {
  label: string;
  unit: string;
  value: number;
  setValue: (v: number) => void;
  min: number;
  max: number;
  step: number;
  presets: number[];
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div className="glass-strong rounded-3xl p-8">
      <div className="flex items-center justify-between">
        <span className="label-mono text-primary">// {label}</span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {min}–{max} {unit}
        </span>
      </div>
      <div className="mt-8 flex items-end justify-center gap-6">
        <button
          onClick={() => setValue(clamp(value - step))}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-2xl font-light transition hover:border-primary/40 hover:bg-primary/10 active:scale-95"
        >
          −
        </button>
        <div className="text-center">
          <input
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(clamp(parseInt(e.target.value || "0", 10)))}
            className="w-44 bg-transparent text-center font-display text-7xl font-semibold tracking-tight outline-none text-emerald-gradient"
          />
          <div className="-mt-2 font-mono text-xs text-muted-foreground">{unit.toUpperCase()}</div>
        </div>
        <button
          onClick={() => setValue(clamp(value + step))}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-2xl font-light transition hover:border-primary/40 hover:bg-primary/10 active:scale-95"
        >
          +
        </button>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value, 10))}
        className="ff-slider mt-8 w-full"
      />
      <div className="mt-6 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => setValue(p)}
            className={`rounded-full border px-3 py-1.5 font-mono text-xs transition ${
              value === p
                ? "border-primary/60 bg-primary/15 text-primary"
                : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-primary/30"
            }`}
          >
            {p} {unit}
          </button>
        ))}
      </div>
    </div>
  );
}

const SCAN_PHASES = [
  "Calibrating spatial sensors",
  "Capturing foot geometry · 47 landmarks",
  "Mapping pressure distribution",
  "Modelling biomechanical signature",
  "Synthesising fit profile",
];

function ScanStep({
  step,
  total,
  kid,
  onComplete,
  onBack,
}: {
  step: number;
  total: number;
  kid: boolean;
  onComplete: () => void;
  onBack?: () => void;
}) {
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!started) return;
    if (phase >= SCAN_PHASES.length) {
      setDone(true);
      return;
    }
    const t = setTimeout(() => setPhase(phase + 1), 1100);
    return () => clearTimeout(t);
  }, [started, phase]);

  return (
    <QuestionShell
      step={step}
      total={total}
      kicker="// BIOMECHANICAL SCAN"
      title={
        done
          ? "Signature acquired."
          : started
            ? "Hold still…"
            : kid
              ? "Step on the platform — let's measure! 👣"
              : "Step on the platform."
      }
      onBack={onBack}
      onNext={done ? onComplete : started ? undefined : () => setStarted(true)}
      nextLabel={done ? "CONTINUE" : started ? "SCANNING…" : "START SCAN"}
      nextDisabled={started && !done}
    >
      <div className="glass-strong overflow-hidden rounded-3xl p-10 md:p-12">
        <div className="grid items-center gap-12 md:grid-cols-[1fr_1.2fr]">
          <div className="relative mx-auto h-80 w-52">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 rounded-full border border-primary/20"
                style={{
                  width: 200 + i * 50,
                  height: 200 + i * 50,
                  marginLeft: -(100 + i * 25),
                  marginTop: -(100 + i * 25),
                }}
                animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                transition={{ duration: 22 + i * 6, repeat: Infinity, ease: "linear" }}
              />
            ))}
            <svg viewBox="0 0 200 400" className="relative h-full w-full">
              <defs>
                <linearGradient id="fg2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.78 0.16 165)" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="oklch(0.85 0.12 200)" stopOpacity="0.5" />
                </linearGradient>
              </defs>
              <path
                d="M100 30 C70 30 55 70 58 130 C60 180 50 230 55 290 C58 340 75 380 100 380 C125 380 142 340 145 290 C150 230 140 180 142 130 C145 70 130 30 100 30 Z"
                fill="none"
                stroke="url(#fg2)"
                strokeWidth="1.5"
                strokeDasharray="3 5"
              />
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
                  animate={started ? { opacity: [0, 1, 0.6], scale: [0, 1.4, 1] } : { opacity: 0 }}
                  transition={{
                    duration: 1.1,
                    delay: i * 0.1,
                    repeat: started && !done ? Infinity : 0,
                    repeatDelay: 3,
                  }}
                />
              ))}
            </svg>
            {started && !done && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute inset-x-0 h-[120px]"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent, oklch(0.78 0.16 165 / 0.4), transparent)",
                    boxShadow: "0 0 70px oklch(0.78 0.16 165 / 0.6)",
                  }}
                  animate={{ y: ["-15%", "115%"] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            )}
          </div>

          <div>
            {!started && (
              <>
                <h3 className="font-display text-3xl font-semibold leading-tight md:text-4xl">
                  {kid ? (
                    <>
                      It's quick — and a little ticklish!{" "}
                      <span className="text-emerald-gradient">No shoes.</span>
                    </>
                  ) : (
                    <>
                      The platform measures{" "}
                      <span className="text-emerald-gradient">47 anatomical points</span> at 0.4 mm
                      precision.
                    </>
                  )}
                </h3>
                <p className="mt-4 text-muted-foreground">
                  {kid
                    ? "Step on with bare feet. The lights will tickle a tiny bit. Done in 8 seconds."
                    : "Foot length · width · arch · pronation · pressure map · ankle flex. No keyboard."}
                </p>
              </>
            )}

            {started && (
              <div>
                <span className="label-mono text-primary">
                  {done
                    ? "COMPLETE"
                    : `PHASE ${Math.min(phase + 1, SCAN_PHASES.length)} / ${SCAN_PHASES.length}`}
                </span>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={phase}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-3 font-display text-2xl font-semibold md:text-3xl"
                  >
                    {done
                      ? kid
                        ? "All done — perfect! 🎉"
                        : "Biomechanical signature locked."
                      : SCAN_PHASES[Math.min(phase, SCAN_PHASES.length - 1)]}
                  </motion.div>
                </AnimatePresence>
                {done && (
                  <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                    {[
                      { l: "FOOT", v: kid ? "21.5" : "27.5" },
                      { l: "ARCH", v: "MED-HI" },
                      { l: "PRONATION", v: "+1.4°" },
                    ].map((t) => (
                      <div
                        key={t.l}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                      >
                        <div className="font-mono text-[10px] text-muted-foreground">{t.l}</div>
                        <div className="mt-1 font-display text-lg font-semibold">{t.v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </QuestionShell>
  );
}

function Slider() {
  return (
    <style>{`
      .ff-slider { -webkit-appearance:none; appearance:none; height:4px; border-radius:9999px;
        background: linear-gradient(90deg, oklch(0.78 0.16 165) 0%, oklch(0.78 0.16 165) 50%, oklch(1 1 1 / 0.1) 50%); outline:none; }
      .ff-slider::-webkit-slider-thumb { -webkit-appearance:none; width:24px; height:24px; border-radius:9999px;
        background:#fff; border:3px solid oklch(0.78 0.16 165); box-shadow: 0 0 18px oklch(0.78 0.16 165 / 0.7); cursor:pointer; }
      .ff-slider::-moz-range-thumb { width:24px; height:24px; border-radius:9999px;
        background:#fff; border:3px solid oklch(0.78 0.16 165); box-shadow: 0 0 18px oklch(0.78 0.16 165 / 0.7); cursor:pointer; }
    `}</style>
  );
}
