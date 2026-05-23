import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { BespokeOrder, LastShape } from "./types";
import { BackButton } from "@/components/signature-ritual/atelier/BackButton";
import { LAST_META, MODEL_META, tonalityImageFilter } from "./types";
import { imageSrc } from "./imageSrc";
import oxford from "@/assets/shoe-oxford.png";
import derby from "@/assets/shoe-derby.png";
import loafer from "@/assets/shoe-loafer.png";
import monk from "@/assets/shoe-monk.png";
import sneaker from "@/assets/shoe-sneaker.png";

const IMAGES = {
  oxford: imageSrc(oxford),
  derby: imageSrc(derby),
  loafer: imageSrc(loafer),
  monk: imageSrc(monk),
  sneaker: imageSrc(sneaker),
} as const;

const LASTS: LastShape[] = ["round", "almond", "square"];

// Subtle CSS transforms emulate sculptural variations of the same shoe
const LAST_TRANSFORM: Record<LastShape, string> = {
  round: "scaleX(0.96) scaleY(1.02)",
  almond: "scaleX(1.05) scaleY(0.97)",
  square: "scaleX(1.02) scaleY(1) skewX(-1deg)",
};

type Phase = "silhouette" | "choose";

const CHARACTER = {
  eyebrow: "oklch(0.9 0.095 75)",
  title: "oklch(0.99 0.022 85)",
  titleShadow:
    "0 0 40px oklch(0.9 0.11 78 / 0.38), 0 2px 16px rgba(0,0,0,0.22)",
  labelActive: "oklch(0.98 0.02 85)",
  labelIdle: "oklch(0.82 0.04 75)",
  tagActive: "oklch(0.93 0.11 78)",
  tagIdle: "oklch(0.76 0.03 72)",
  cta: "oklch(0.93 0.11 78)",
  ctaBorder: "oklch(0.93 0.11 78 / 0.65)",
  ambient: "oklch(0.9 0.11 78 / 0.14)",
  glow: "oklch(0.92 0.11 78 / 0.22)",
} as const;

export function CharacterSelection({
  order,
  onUpdate,
  onContinue,
  onBack,
}: {
  order: BespokeOrder;
  onUpdate: (p: Partial<BespokeOrder>) => void;
  onContinue: () => void;
  onBack?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("silhouette");
  const img = order.model ? IMAGES[order.model] : imageSrc(oxford);
  const meta = order.model ? MODEL_META[order.model] : MODEL_META.oxford;
  const colorFilter = tonalityImageFilter(order.color);

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
          background: `radial-gradient(ellipse 55% 40% at 50% 42%, ${CHARACTER.ambient} 0%, transparent 68%)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5 }}
        className="absolute top-20 z-20 text-center"
      >
        <p className="tracking-whisper" style={{ color: CHARACTER.eyebrow }}>
          Charakter
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {phase === "silhouette" ? (
          <motion.div
            key="silhouette"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6 }}
            className="relative z-20 flex flex-col items-center"
          >
            <motion.img
              src={img}
              alt={meta.name}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.6, ease: "easeOut" }}
              className="max-h-[45vh] max-w-[70%] object-contain drop-shadow-[0_22px_44px_rgba(0,0,0,0.5)]"
              style={{ filter: colorFilter }}
            />

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 2, delay: 1.5 }}
              className="font-display mt-12 text-center text-3xl italic md:text-5xl"
              style={{
                color: CHARACTER.title,
                textShadow: CHARACTER.titleShadow,
              }}
            >
              Nun verfeinern wir seinen Charakter.
            </motion.p>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 3 }}
              onClick={() => setPhase("choose")}
              className="group mt-12 tracking-atelier transition-opacity hover:opacity-95"
              style={{ color: CHARACTER.cta }}
            >
              <span
                className="border-b pb-2 transition-colors group-hover:border-[oklch(0.99_0.022_85/0.55)]"
                style={{ borderColor: CHARACTER.ctaBorder }}
              >
                Form wählen
              </span>
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="choose"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="relative z-20 flex w-full flex-col items-center"
          >
            {/* Three sculptural silhouettes */}
            <div className="flex items-end justify-center gap-8 md:gap-16 w-full max-w-5xl">
              {LASTS.map((shape) => {
                const selected = order.last === shape;
                return (
                  <button
                    key={shape}
                    onClick={() => onUpdate({ last: shape })}
                    className="group flex flex-col items-center"
                  >
                    <motion.div
                      animate={{
                        scale: selected ? 1 : 0.88,
                        opacity: selected ? 1 : 0.78,
                      }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      className="relative"
                    >
                      <img
                        src={img}
                        alt={LAST_META[shape].name}
                        className="max-h-[28vh] md:max-h-[32vh] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.48)]"
                        style={{
                          filter: `${colorFilter}${
                            selected ? "" : " brightness(0.94)"
                          }`.trim(),
                          transform: LAST_TRANSFORM[shape],
                          transition: "filter 1s ease, transform 1s ease",
                        }}
                      />
                      {selected && (
                        <motion.div
                          layoutId="last-glow"
                          className="absolute -inset-8 -z-10"
                          style={{
                            background: `radial-gradient(ellipse, ${CHARACTER.glow} 0%, transparent 70%)`,
                          }}
                        />
                      )}
                    </motion.div>

                    <div className="mt-6 text-center">
                      <p
                        className="font-display text-xl italic transition-colors md:text-2xl"
                        style={{
                          color: selected
                            ? CHARACTER.labelActive
                            : CHARACTER.labelIdle,
                        }}
                      >
                        {LAST_META[shape].name}
                      </p>
                      <p
                        className="mt-2 text-[0.55rem] uppercase tracking-[0.3em] transition-colors"
                        style={{
                          color: selected
                            ? CHARACTER.tagActive
                            : CHARACTER.tagIdle,
                        }}
                      >
                        {LAST_META[shape].tagline}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.8 }}
              onClick={onContinue}
              className="group mt-16 tracking-atelier transition-opacity hover:opacity-95"
              style={{ color: CHARACTER.cta }}
            >
              <span
                className="border-b pb-2 transition-colors group-hover:border-[oklch(0.99_0.022_85/0.55)]"
                style={{ borderColor: CHARACTER.ctaBorder }}
              >
                Weiter
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
