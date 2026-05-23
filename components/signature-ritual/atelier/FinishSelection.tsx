"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { BackButton } from "@/components/signature-ritual/atelier/BackButton";
import type { LeatherTypeRow } from "@/api/premium/premiumShoeApi";

const FINISH_IMAGE_STANDARD = "/images/finish-standard.png";
const FINISH_IMAGE_PATINA = "/images/finish-patina.png";

/** Finish screen — bright copy; product art stays fully visible */
const FINISH = {
  eyebrow: "oklch(0.9 0.095 75)",
  title: "oklch(0.99 0.022 85)",
  titleShadow:
    "0 0 40px oklch(0.9 0.11 78 / 0.35), 0 2px 14px rgba(0,0,0,0.2)",
  subtitle: "oklch(0.84 0.035 75)",
  model: "oklch(0.78 0.03 72)",
  kickerActive: "oklch(0.9 0.09 78)",
  kickerIdle: "oklch(0.82 0.04 75)",
  cardTitleActive: "oklch(0.99 0.02 85)",
  cardTitleIdle: "oklch(0.92 0.02 82)",
  descActive: "oklch(0.86 0.035 75)",
  descIdle: "oklch(0.78 0.03 72)",
  lineActive: "oklch(0.92 0.11 78 / 0.9)",
  lineIdle: "oklch(0.88 0.04 75 / 0.45)",
  cta: "oklch(0.93 0.11 78)",
  halo: "oklch(0.92 0.11 78 / 0.16)",
} as const;

function finishCardMeta(lt: LeatherTypeRow) {
  const isPatina = lt.isPatina;
  return {
    image: isPatina ? FINISH_IMAGE_PATINA : FINISH_IMAGE_STANDARD,
    kicker: isPatina
      ? "Von Hand veredelt · Florenz"
      : "Glatt · Reines Kalbsleder",
    title: isPatina ? "Patina" : lt.name?.trim() || "Standard",
    description:
      (lt.description ?? "").trim() ||
      (isPatina
        ? "Von Hand veredelte Tiefe mit einzigartigem Charakter."
        : "Zeitlose Klarheit und elegante Zurückhaltung."),
  };
}

export function FinishSelection({
  leatherTypes,
  modelLabel,
  onBack,
  onConfirm,
}: {
  leatherTypes: LeatherTypeRow[];
  modelLabel?: string;
  onBack?: () => void;
  onConfirm: (leatherType: LeatherTypeRow) => void;
}) {
  const sorted = useMemo(
    () =>
      [...leatherTypes].sort((a, b) =>
        a.isPatina === b.isPatina ? 0 : a.isPatina ? 1 : -1,
      ),
    [leatherTypes],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeSelectedId = useMemo(() => {
    if (sorted.length === 0) return null;
    if (selectedId && sorted.some((t) => t.id === selectedId)) return selectedId;
    return sorted[0].id;
  }, [sorted, selectedId]);

  const selected =
    sorted.find((t) => t.id === activeSelectedId) ?? null;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.4 }}
      className="absolute inset-0 flex flex-col px-6 md:px-8"
    >
      {onBack ? <BackButton onClick={onBack} /> : null}

      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, delay: 0.15 }}
        className="relative z-10 shrink-0 pt-[5vh] text-center px-4 md:pt-[6vh]"
      >
        <p
          className="text-[0.65rem] font-light tracking-[0.55em] md:text-[0.7rem]"
          style={{ color: FINISH.eyebrow }}
        >
          DIE VEREDELUNG
        </p>
        <h1
          className="font-display mt-5 text-3xl font-light italic md:text-4xl lg:text-5xl"
          style={{ color: FINISH.title, textShadow: FINISH.titleShadow }}
        >
          Wählen Sie das Finish.
        </h1>
        <p
          className="mx-auto mt-4 max-w-lg text-xs font-light tracking-wide md:text-sm"
          style={{ color: FINISH.subtitle }}
        >
          Zwei Wege, dem Leder Charakter zu verleihen.
          {modelLabel ? (
            <span className="mt-1 block" style={{ color: FINISH.model }}>
              {modelLabel}
            </span>
          ) : null}
        </p>
      </motion.header>

      <motion.div className="mx-auto mt-auto flex min-h-0 w-full max-w-5xl flex-1 items-end justify-center gap-8 px-2 pb-[12vh] pt-[min(8vh,5rem)] sm:max-w-6xl sm:gap-12 sm:pt-[10vh] md:gap-16 lg:max-w-7xl lg:gap-20">
        {sorted.map((lt, i) => {
          const meta = finishCardMeta(lt);
          const isSelected = activeSelectedId === lt.id;
          const isDimmed = Boolean(activeSelectedId) && !isSelected;
          return (
            <motion.button
              key={lt.id}
              type="button"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: isDimmed ? 0.78 : 1, y: 0 }}
              transition={{
                duration: 1.4,
                delay: 0.35 + i * 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              onClick={() => setSelectedId(lt.id)}
              className="group relative flex min-w-0 flex-1 flex-col items-center text-center max-w-[min(46vw,400px)]"
            >
              <motion.div
                className="pointer-events-none absolute -inset-6 -z-10 rounded-full md:-inset-10"
                animate={{ opacity: isSelected ? 1 : 0 }}
                transition={{ duration: 0.8 }}
                style={{
                  background: `radial-gradient(ellipse 50% 45% at 50% 38%, ${FINISH.halo} 0%, transparent 72%)`,
                }}
              />

              <motion.div
                animate={{
                  y: isSelected ? -6 : 0,
                  scale: isSelected ? 1.02 : 1,
                }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full"
              >
                <motion.img
                  src={meta.image}
                  alt={meta.title}
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.6,
                  }}
                  className="relative z-10 mx-auto h-[36vh] min-h-[200px] w-auto max-w-[min(100%,380px)] select-none object-contain sm:h-[40vh] md:h-[44vh] lg:h-[48vh]"
                  style={{
                    filter: isSelected
                      ? "drop-shadow(0 24px 44px rgba(0,0,0,0.5))"
                      : "drop-shadow(0 20px 40px rgba(0,0,0,0.45))",
                    transition: "filter 0.8s ease, opacity 0.8s ease",
                  }}
                  draggable={false}
                />
              </motion.div>

              <motion.div className="relative mt-8 md:mt-10">
                <p
                  className="text-[0.55rem] uppercase tracking-[0.28em] md:text-[0.6rem]"
                  style={{
                    color: isSelected ? FINISH.kickerActive : FINISH.kickerIdle,
                  }}
                >
                  {meta.kicker}
                </p>
                <h2
                  className="font-display mt-3 text-3xl italic md:text-4xl"
                  style={{
                    color: isSelected
                      ? FINISH.cardTitleActive
                      : FINISH.cardTitleIdle,
                  }}
                >
                  {meta.title}
                </h2>
                <p
                  className="mx-auto mt-3 max-w-[240px] text-xs leading-relaxed md:text-[0.8rem]"
                  style={{
                    color: isSelected ? FINISH.descActive : FINISH.descIdle,
                  }}
                >
                  {meta.description}
                </p>
                <motion.div
                  className="mx-auto mt-6 h-px"
                  animate={{
                    width: isSelected ? 40 : 28,
                    backgroundColor: isSelected
                      ? FINISH.lineActive
                      : FINISH.lineIdle,
                  }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
              </motion.div>
            </motion.button>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: activeSelectedId ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        className="absolute bottom-[6vh] left-1/2 z-10 -translate-x-1/2"
        style={{ pointerEvents: selected ? "auto" : "none" }}
      >
        <button
          type="button"
          disabled={!selected}
          onClick={() => {
            if (selected) onConfirm(selected);
          }}
          className="group flex flex-col items-center px-8 py-3"
        >
          <span
            className="text-[0.7rem] font-light tracking-[0.55em] md:text-[0.75rem]"
            style={{ color: FINISH.cta }}
          >
            FORTFAHREN
          </span>
          <span
            className="mt-3 h-px w-full max-w-[7.5rem] transition-all duration-500 group-hover:opacity-100"
            style={{ backgroundColor: "oklch(0.93 0.11 78 / 0.7)" }}
            aria-hidden
          />
        </button>
      </motion.div>
    </motion.section>
  );
}
