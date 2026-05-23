import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { updatePerson, useGroup } from "@/ski-rental/lib/session";

const RIDE = [
  "Comfortable & forgiving",
  "Balanced & versatile",
  "Sporty & precise",
  "Aggressive & race-oriented",
];
const TERRAIN = ["Groomed pistes", "All mountain", "Powder / freeride", "Park & freestyle"];
const MATTERS = ["Comfort", "Stability", "Speed", "Precision", "Easy control"];

export function EditAnswers() {
  const g = useGroup();
  const [open, setOpen] = useState(false);
  const person = g.people.find((p) => p.id === g.activePersonId) ?? g.people[0];

  if (!person) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/80 px-4 py-2 backdrop-blur-xl transition hover:border-primary/60"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-primary glow-ring" />
        <span className="label-mono">VIEW &amp; EDIT PROFILE</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-xl"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="fixed inset-y-0 right-0 z-[80] w-[min(440px,92vw)] glass-strong overflow-y-auto p-8"
            >
              <div className="flex items-center justify-between">
                <span className="label-mono text-primary">// EDIT PROFILE</span>
                <button onClick={() => setOpen(false)} className="label-mono hover:text-foreground">
                  CLOSE ✕
                </button>
              </div>
              <h2 className="mt-3 font-display text-3xl font-semibold">
                {person.first} {person.last}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Adjust without restarting. AI re-tunes recommendations live.
              </p>

              <Section title="RIDING STYLE">
                {RIDE.map((r) => (
                  <Pill
                    key={r}
                    active={person.ride === r}
                    onClick={() => updatePerson(person.id, { ride: r })}
                  >
                    {r}
                  </Pill>
                ))}
              </Section>
              <Section title="TERRAIN">
                {TERRAIN.map((r) => (
                  <Pill
                    key={r}
                    active={person.terrain === r}
                    onClick={() => updatePerson(person.id, { terrain: r })}
                  >
                    {r}
                  </Pill>
                ))}
              </Section>
              <Section title="WHAT MATTERS">
                {MATTERS.map((r) => (
                  <Pill
                    key={r}
                    active={person.matters === r}
                    onClick={() => updatePerson(person.id, { matters: r })}
                  >
                    {r}
                  </Pill>
                ))}
              </Section>

              <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="label-mono">// AI WILL RE-TUNE</div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Changes apply immediately. Setup updates without losing your scan or queue
                  position.
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <div className="label-mono">{title}</div>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Pill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        active
          ? "border-primary/60 bg-primary/15 text-foreground"
          : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20"
      }`}
    >
      {children}
    </button>
  );
}
