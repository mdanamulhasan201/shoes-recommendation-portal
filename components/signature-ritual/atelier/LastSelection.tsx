"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import lastClassic from "@/assets/last-classic.png";
import lastSoft from "@/assets/last-soft.png";
import { BackButton } from "@/components/signature-ritual/atelier/BackButton";
import { imageSrc } from "@/components/signature-ritual/atelier/imageSrc";
import type { LastShape, ShoeModel } from "@/components/signature-ritual/atelier/types";
import { MODEL_META } from "@/components/signature-ritual/atelier/types";

type Choice = "almond" | "round";

/** Last (form) screen — brighter gold / ivory for kiosk legibility */
const LAST = {
  eyebrow: "oklch(0.9 0.095 75)",
  title: "oklch(0.99 0.022 85)",
  titleShadow:
    "0 0 40px oklch(0.9 0.11 78 / 0.4), 0 2px 14px rgba(0,0,0,0.2)",
  labelActive: "oklch(0.92 0.1 78)",
  labelIdle: "oklch(0.82 0.04 72 / 0.72)",
  descActive: "oklch(0.98 0.02 85 / 0.98)",
  descIdle: "oklch(0.78 0.03 72 / 0.65)",
  editorial: "oklch(0.9 0.09 75 / 0.9)",
  cta: "oklch(0.93 0.11 78)",
  indicatorActive: "oklch(0.92 0.11 78 / 0.9)",
  indicatorIdle: "oklch(0.88 0.06 72 / 0.38)",
  haloSelected: "oklch(0.92 0.11 78 / 0.18)",
  haloIdle: "oklch(0.9 0.11 78 / 0.08)",
} as const;

const OPTIONS: {
  id: Choice;
  label: string;
  description: string;
  image: string;
  last: LastShape;
}[] = [
  {
    id: "almond",
    label: "KLASSISCH ELEGANT",
    description: "Leicht verlängert. Zeitlos elegant.",
    image: imageSrc(lastClassic),
    last: "almond",
  },
  {
    id: "round",
    label: "SOFT ROUND",
    description: "Weicher. Moderner. Vielseitig.",
    image: imageSrc(lastSoft),
    last: "round",
  },
];

export function LastSelection({
  onSelect,
  onBack,
  model,
}: {
  onSelect: (last: LastShape) => void;
  onBack?: () => void;
  model?: ShoeModel | null;
}) {
  const [selected, setSelected] = useState<Choice | null>(null);
  const modelName = model ? MODEL_META[model].name : null;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.4 }}
      className="absolute inset-0 flex flex-col items-center justify-center px-8"
    >
      {onBack ? <BackButton onClick={onBack} /> : null}
      {/* Top label */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.6, delay: 0.2 }}
        className="absolute top-[8vh] text-center"
      >
        <p
          className="text-[0.65rem] tracking-[0.6em] md:text-[0.7rem]"
          style={{ color: LAST.eyebrow }}
        >
          {modelName ? `${modelName.toUpperCase()} · DIE FORM` : "PRÄZISION"}
        </p>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.8, delay: 0.5 }}
        className="font-display mb-[7vh] text-center text-3xl font-light italic md:mb-[9vh] md:text-5xl lg:text-6xl"
        style={{
          color: LAST.title,
          letterSpacing: "0.01em",
          textShadow: LAST.titleShadow,
        }}
      >
        Ihre Form. Präzise verstanden.
      </motion.h1>

      {/* Two lasts */}
      <div className="flex w-full max-w-6xl items-center justify-center gap-12 md:gap-28 lg:gap-40">
        {OPTIONS.map((opt, i) => {
          const isSelected = selected === opt.id;
          const isEditorialPick = model === "oxford" && opt.id === "almond";
          return (
            <motion.button
              key={opt.id}
              type="button"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 1.6,
                delay: 0.8 + i * 0.25,
                ease: [0.22, 1, 0.36, 1],
              }}
              onClick={() => setSelected(opt.id)}
              className="group relative flex flex-col items-center"
            >
              {/* Spotlight halo */}
              <motion.div
                className="pointer-events-none absolute -inset-10 -z-10 rounded-full"
                animate={{
                  opacity: isSelected ? 1 : 0.65,
                }}
                transition={{ duration: 1 }}
                style={{
                  background: `radial-gradient(ellipse 55% 60% at 50% 45%, ${isSelected ? LAST.haloSelected : LAST.haloIdle} 0%, transparent 70%)`,
                }}
              />

              <motion.div
                animate={{
                  y: isSelected ? -6 : 0,
                  scale: isSelected ? 1.02 : 1,
                }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                <motion.img
                  src={opt.image}
                  alt={opt.label}
                  animate={{
                    y: [0, -4, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.8,
                  }}
                  className="relative z-10 h-[42vh] w-auto max-w-full select-none object-contain md:h-[52vh]"
                  style={{
                    filter: isSelected
                      ? "drop-shadow(0 24px 44px rgba(0,0,0,0.5))"
                      : "drop-shadow(0 20px 36px rgba(0,0,0,0.45))",
                    transition: "filter 1s ease",
                  }}
                  draggable={false}
                />
              </motion.div>

              {/* Label */}
              <div className="relative mt-10 text-center">
                {isEditorialPick ? (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, delay: 1.2 }}
                    className="absolute -top-5 left-1/2 -translate-x-1/2 text-[0.55rem] font-light tracking-[0.55em] whitespace-nowrap"
                    style={{ color: LAST.editorial }}
                  >
                    — EDITORIAL EMPFOHLEN —
                  </motion.p>
                ) : null}
                <p
                  className="text-[0.7rem] tracking-[0.5em] md:text-[0.75rem]"
                  style={{
                    color: isSelected ? LAST.labelActive : LAST.labelIdle,
                    transition: "color 0.6s",
                  }}
                >
                  {opt.label}
                </p>
                <p
                  className="font-display mt-3 text-sm font-light italic md:text-base"
                  style={{
                    color: isSelected ? LAST.descActive : LAST.descIdle,
                    transition: "color 0.6s",
                  }}
                >
                  {opt.description}
                </p>

                {/* Selection indicator */}
                <motion.div
                  className="mx-auto mt-5 h-px"
                  animate={{
                    width: isSelected ? 56 : 14,
                    backgroundColor: isSelected
                      ? LAST.indicatorActive
                      : LAST.indicatorIdle,
                  }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: selected ? 1 : 0 }}
        transition={{ duration: 1 }}
        className="absolute bottom-[7vh]"
        style={{ pointerEvents: selected ? "auto" : "none" }}
      >
        <button
          type="button"
          disabled={!selected}
          onClick={() => {
            const opt = OPTIONS.find((o) => o.id === selected);
            if (opt) onSelect(opt.last);
          }}
          className="group relative px-12 py-4"
          style={{
            cursor: selected ? "pointer" : "default",
          }}
        >
          <span
            className="relative text-[0.7rem] tracking-[0.55em] transition-colors md:text-[0.75rem]"
            style={{ color: LAST.cta }}
          >
            FORTFAHREN
          </span>
          <span
            className="absolute bottom-2 left-1/2 h-px -translate-x-1/2 transition-all duration-700 group-hover:w-24"
            style={{
              width: "3rem",
              background:
                "linear-gradient(90deg, transparent, oklch(0.93 0.11 78 / 0.75), transparent)",
            }}
          />
        </button>
      </motion.div>
    </motion.section>
  );
}
