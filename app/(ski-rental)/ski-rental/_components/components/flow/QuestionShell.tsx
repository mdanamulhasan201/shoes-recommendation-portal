import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

export function QuestionShell({
  step,
  total,
  kicker,
  title,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  skip,
}: {
  step: number;
  total: number;
  kicker: string;
  title: string;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  skip?: () => void;
}) {
  return (
    <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-6 pt-28 pb-16">
      {/* progress */}
      <div className="mb-12 flex items-center gap-4">
        <span className="label-mono">{kicker}</span>
        <div className="relative h-px flex-1 overflow-hidden bg-white/10">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${(step / total) * 100}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {String(step).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.5 }}
          className="flex flex-1 flex-col"
        >
          <h2 className="text-balance font-display text-4xl font-semibold leading-tight md:text-6xl">
            {title}
          </h2>
          <div className="mt-12 flex-1">{children}</div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-12 flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={!onBack}
          className="label-mono transition-colors hover:text-foreground disabled:opacity-30"
        >
          ← BACK
        </button>
        <div className="flex items-center gap-6">
          {skip && (
            <button onClick={skip} className="label-mono hover:text-foreground">
              SKIP
            </button>
          )}
          <button
            onClick={onNext}
            disabled={nextDisabled}
            className="group relative inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-semibold tracking-[0.2em] text-primary-foreground transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted-foreground"
          >
            <span className="absolute inset-0 rounded-full bg-primary/40 blur-xl opacity-0 transition group-enabled:group-hover:opacity-100" />
            <span className="relative">{nextLabel}</span>
            <span className="relative">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChoiceCard({
  active,
  onClick,
  label,
  desc,
  icon,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  desc?: string;
  icon?: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 ${
        active
          ? "border border-primary/60 bg-primary/10 shadow-[0_0_40px_oklch(0.78_0.16_165_/_0.25)]"
          : "glass hover:border-primary/30 hover:-translate-y-0.5"
      }`}
    >
      {active && (
        <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-primary glow-ring" />
      )}
      {icon && <div className="mb-4 text-primary">{icon}</div>}
      <div className="font-display text-xl font-semibold">{label}</div>
      {desc && <div className="mt-2 text-sm text-muted-foreground">{desc}</div>}
    </button>
  );
}
