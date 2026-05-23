"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Particles } from "@/ski-rental/components/Particles";
import { LangSelector } from "@/ski-rental/components/LangSelector";
import { addPerson, removePerson, setGroup, useGroup, type Person } from "@/ski-rental/lib/session";

export default function GroupRoute() {
  const router = useRouter();
  const g = useGroup();
  const [adding, setAdding] = useState<null | "adult" | "child">(null);

  const allReady = g.people.length > 0 && g.people.every((p) => p.scanned && p.done);
  const primary = g.people.find((p) => p.kind === "adult");

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <Particles density={40} />
      <div className="absolute inset-x-0 top-0 h-[55vh] bg-[radial-gradient(circle_at_50%_0%,oklch(0.78_0.16_165/0.10),transparent_70%)]" />

      <header className="relative z-10 flex items-center justify-between px-10 py-8">
        <Link href="/ski-rental" className="flex items-center gap-3">
          <span className="relative flex h-7 w-7 items-center justify-center">
            <span className="absolute inset-0 rounded-md bg-primary/20 blur-md" />
            <span className="relative h-3 w-3 rounded-sm bg-primary glow-ring" />
          </span>
          <span className="font-display text-sm font-semibold tracking-[0.42em]">FEETFIRST</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="label-mono">// GROUP SESSION</span>
          <LangSelector />
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-20">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <span className="label-mono text-primary">// FAMILY / GROUP RENTAL</span>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
            <div>
              <input
                value={g.groupName}
                onChange={(e) => setGroup({ groupName: e.target.value })}
                placeholder="Family name (e.g. Hoffmann)"
                className="bg-transparent font-display text-5xl font-semibold tracking-tight outline-none placeholder:text-white/15 md:text-6xl"
              />
              <div className="mt-3 font-display text-2xl text-muted-foreground">
                <span className="text-emerald-gradient">{g.people.length}</span>{" "}
                {g.people.length === 1 ? "person" : "people"} · single checkout
              </div>
            </div>
            <div className="glass rounded-2xl px-5 py-3">
              <div className="label-mono">// GROUP NUMBER</div>
              <div className="mt-1 font-mono text-2xl text-emerald-gradient">
                A-{200 + (g.people.length || 0)}
              </div>
            </div>
          </div>
        </motion.div>

        {/* people list */}
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {g.people.map((p, i) => (
            <PersonCard key={p.id} person={p} index={i} primary={p === primary} />
          ))}

          {/* add cards */}
          <button
            onClick={() => setAdding("adult")}
            className="group glass relative flex items-center gap-5 rounded-2xl border-dashed p-6 text-left transition hover:border-primary/40"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-2xl text-primary">
              +
            </div>
            <div>
              <div className="font-display text-xl font-semibold">Add adult</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Friend, partner, family member (18+)
              </div>
            </div>
          </button>
          <button
            onClick={() => setAdding("child")}
            className="group glass relative flex items-center gap-5 rounded-2xl border-dashed p-6 text-left transition hover:border-primary/40"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-2xl text-accent">
              ★
            </div>
            <div>
              <div className="font-display text-xl font-semibold">Add child</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Kids profile · friendly UI · safety-first AI
              </div>
            </div>
          </button>
        </div>

        {/* footer */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-6 rounded-2xl glass p-6">
          <Link href="/ski-rental/start" className="label-mono hover:text-foreground">
            ← BACK
          </Link>
          <button
            disabled={!allReady}
            onClick={() => router.push("/ski-rental/insurance")}
            className={`group relative inline-flex items-center gap-3 rounded-full px-10 py-4 text-sm font-semibold tracking-[0.3em] transition ${
              allReady ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground"
            }`}
          >
            CONTINUE TO PROTECTION →
          </button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          {allReady
            ? "All profiles complete. One reservation, one payment, one pickup."
            : "Each person needs their own scan and setup. The system pays once at the end."}
        </p>
      </section>

      <AnimatePresence>
        {adding && (
          <AddPersonModal
            kind={adding}
            onClose={() => setAdding(null)}
            mustBeAdult={g.people.length === 0}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function PersonCard({
  person,
  index,
  primary,
}: {
  person: Person;
  index: number;
  primary: boolean;
}) {
  const isKid = person.kind === "child";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`glass-strong relative overflow-hidden rounded-2xl p-6 ${isKid ? "border-accent/30" : ""}`}
    >
      {primary && (
        <span className="absolute right-4 top-4 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 label-mono text-primary">
          PRIMARY
        </span>
      )}
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full border text-xl ${
            isKid
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-primary/40 bg-primary/10 text-primary"
          }`}
        >
          {isKid ? "★" : person.first[0]?.toUpperCase() || "•"}
        </div>
        <div className="flex-1">
          <div className="font-display text-2xl font-semibold">
            {person.first} {person.last}
          </div>
          <div className="mt-0.5 font-mono text-xs text-muted-foreground">
            {isKid ? "KIDS PROFILE" : "ADULT"} · {person.email}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-2 font-mono text-xs">
        <Step label="Scan" done={person.scanned} />
        <Step label="Setup engineered" done={person.done} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          onClick={() => removePerson(person.id)}
          className="label-mono text-muted-foreground transition hover:text-destructive"
        >
          REMOVE
        </button>
        <Link
          href={`/ski-rental/rental?pid=${encodeURIComponent(person.id)}`}
          className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-2 text-xs font-semibold tracking-[0.25em] text-primary transition hover:bg-primary/25"
        >
          {person.done ? "REVIEW" : person.scanned ? "FINISH SETUP" : "START SCAN"} →
        </Link>
      </div>
    </motion.div>
  );
}

function Step({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-1.5 w-1.5 rounded-full ${done ? "bg-primary glow-ring" : "bg-white/20"}`}
      />
      <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      {done && <span className="ml-auto text-primary">✓</span>}
    </div>
  );
}

function AddPersonModal({
  kind,
  onClose,
  mustBeAdult,
}: {
  kind: "adult" | "child";
  onClose: () => void;
  mustBeAdult: boolean;
}) {
  const router = useRouter();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState<number | undefined>(kind === "child" ? 8 : undefined);
  const [gender, setGender] = useState("");

  const isChild = kind === "child";
  const adultMissing = mustBeAdult && isChild;
  const ok = first && last && email && (isChild ? age && age < 18 : true) && !adultMissing;

  const submit = () => {
    if (!ok) return;
    const p = addPerson({ first, last, email, gender, kind, age });
    router.push(`/ski-rental/rental?pid=${encodeURIComponent(p.id)}`);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-2xl"
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed left-1/2 top-1/2 z-[80] w-[min(540px,92vw)] -translate-x-1/2 -translate-y-1/2 glass-strong rounded-3xl p-8"
      >
        <span className="label-mono text-primary">// ADD {kind.toUpperCase()}</span>
        <h3 className="mt-2 font-display text-3xl font-semibold">
          {isChild ? "Tell us about the child." : "Add another adult to the group."}
        </h3>
        {adultMissing && (
          <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            The first person must be an adult (18+) and becomes the main account holder.
          </div>
        )}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Input label="FIRST NAME" value={first} onChange={setFirst} />
          <Input label="LAST NAME" value={last} onChange={setLast} />
          <Input label="EMAIL" value={email} onChange={setEmail} full />
          {isChild && (
            <label className="glass block rounded-xl p-4 md:col-span-2">
              <span className="label-mono">AGE · {age ?? "—"}</span>
              <input
                type="range"
                min={3}
                max={17}
                value={age ?? 8}
                onChange={(e) => setAge(Number(e.target.value))}
                className="ff-slider mt-3 w-full"
              />
            </label>
          )}
          {!isChild && (
            <div className="md:col-span-2">
              <span className="label-mono">GENDER</span>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {["Male", "Female", "Prefer not to say"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`rounded-xl border px-3 py-3 text-sm transition ${
                      gender === g
                        ? "border-primary/60 bg-primary/10"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="mt-8 flex items-center justify-between">
          <button onClick={onClose} className="label-mono hover:text-foreground">
            CANCEL
          </button>
          <button
            onClick={submit}
            disabled={!ok}
            className={`rounded-full px-8 py-3 text-sm font-semibold tracking-[0.25em] transition ${
              ok ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground"
            }`}
          >
            CONTINUE TO SCAN →
          </button>
        </div>
      </motion.div>
    </>
  );
}

function Input({
  label,
  value,
  onChange,
  full,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  full?: boolean;
}) {
  return (
    <label className={`glass block rounded-xl p-4 ${full ? "md:col-span-2" : ""}`}>
      <span className="label-mono">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full bg-transparent font-display text-xl font-semibold outline-none placeholder:text-white/15"
      />
    </label>
  );
}
