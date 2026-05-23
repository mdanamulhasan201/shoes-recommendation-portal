import { motion } from "framer-motion";
import { BackButton } from "@/components/signature-ritual/atelier/BackButton";

const SIGNATURE = {
  eyebrow: "oklch(0.9 0.095 75)",
  title: "oklch(0.99 0.022 85)",
  titleShadow:
    "0 0 40px oklch(0.9 0.11 78 / 0.35), 0 2px 14px rgba(0,0,0,0.2)",
  previewKicker: "oklch(0.88 0.09 75)",
  engraved: "oklch(0.92 0.11 78)",
  engravedShadow:
    "0 1px 0 rgba(0,0,0,0.35), 0 0 28px oklch(0.9 0.11 78 / 0.45)",
  placeholder: "oklch(0.78 0.03 72 / 0.55)",
  input: "oklch(0.99 0.022 85)",
  hint: "oklch(0.82 0.04 75)",
  cta: "oklch(0.93 0.11 78)",
  ctaBorder: "oklch(0.93 0.11 78 / 0.65)",
  ambient: "oklch(0.9 0.11 78 / 0.12)",
} as const;

export function Signature({
  value,
  onChange,
  onContinue,
  onBack,
}: {
  value: string;
  onChange: (v: string) => void;
  onContinue: () => void;
  onBack?: () => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className="absolute inset-0 flex flex-col items-center justify-center px-8"
    >
      {onBack ? <BackButton onClick={onBack} /> : null}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 40%, ${SIGNATURE.ambient} 0%, transparent 70%)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2, delay: 0.3 }}
        className="relative z-20 mb-12 text-center"
      >
        <p
          className="tracking-whisper mb-4"
          style={{ color: SIGNATURE.eyebrow }}
        >
          Personifizierung
        </p>
        <p
          className="font-display text-4xl italic md:text-6xl"
          style={{ color: SIGNATURE.title, textShadow: SIGNATURE.titleShadow }}
        >
          Ihre Signatur
        </p>
      </motion.div>

      {/* Engraved lining preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, delay: 0.8 }}
        className="relative z-20 w-full max-w-2xl"
      >
        <div
          className="relative overflow-hidden rounded-sm p-16"
          style={{
            background:
              "radial-gradient(ellipse at center, #4a3020 0%, #241610 78%)",
            boxShadow:
              "inset 0 0 60px rgba(0,0,0,0.45), 0 24px 56px rgba(0,0,0,0.45)",
          }}
        >
          <div
            className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />

          <div className="relative text-center">
            <p
              className="mb-6 text-[0.55rem] uppercase tracking-[0.5em]"
              style={{ color: SIGNATURE.previewKicker }}
            >
              — Innen graviert —
            </p>
            <p
              className="font-display text-5xl italic md:text-7xl"
              style={{
                color: SIGNATURE.engraved,
                textShadow: SIGNATURE.engravedShadow,
                letterSpacing: "0.05em",
                minHeight: "1.2em",
              }}
            >
              {value || (
                <span style={{ color: SIGNATURE.placeholder }}>Ihr Name</span>
              )}
            </p>
            <div className="mt-6 flex justify-center">
              <div
                className="h-px w-24"
                style={{ background: "oklch(0.92 0.11 78 / 0.45)" }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 1.3 }}
        className="relative z-20 mt-10 w-full max-w-md"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 24))}
          placeholder="Initialen oder Name"
          maxLength={24}
          className="w-full border-b bg-transparent py-3 text-center font-display text-2xl italic outline-none transition-colors placeholder:font-display placeholder:italic placeholder:text-[oklch(0.78_0.03_72/0.55)] focus:border-[oklch(0.93_0.11_78)]"
          style={{
            color: SIGNATURE.input,
            borderColor: "oklch(0.92 0.11 78 / 0.35)",
          }}
        />
        <p
          className="mt-3 text-center text-[0.55rem] uppercase tracking-[0.4em]"
          style={{ color: SIGNATURE.hint }}
        >
          {value.length}/24 · optional
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 1.8 }}
        onClick={onContinue}
        className="relative z-20 group mt-12 tracking-atelier transition-opacity hover:opacity-95"
        style={{ color: SIGNATURE.cta }}
      >
        <span
          className="border-b pb-2 transition-colors group-hover:border-[oklch(0.99_0.022_85/0.55)]"
          style={{ borderColor: SIGNATURE.ctaBorder }}
        >
          Weiter
        </span>
      </motion.button>
    </motion.section>
  );
}
