import { motion } from "framer-motion";
import { useState } from "react";
import type { BespokeOrder } from "./types";
import { BackButton } from "@/components/signature-ritual/atelier/BackButton";
import { COLOR_META, MODEL_META, tonalityImageFilter } from "./types";
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

const REVEAL = {
  eyebrow: "oklch(0.9 0.095 75)",
  meta: "oklch(0.86 0.04 75)",
  title: "oklch(0.99 0.022 85)",
  titleShadow:
    "0 0 40px oklch(0.9 0.11 78 / 0.38), 0 2px 16px rgba(0,0,0,0.22)",
  signature: "oklch(0.93 0.11 78)",
  hint: "oklch(0.8 0.03 72)",
  cta: "oklch(0.93 0.11 78)",
  ctaBorder: "oklch(0.93 0.11 78 / 0.65)",
  ambient: "oklch(0.9 0.11 78 / 0.16)",
} as const;

export function CinematicReveal({
  order,
  onContinue,
  onBack,
}: {
  order: BespokeOrder;
  onContinue: () => void;
  onBack?: () => void;
}) {
  // User-controlled rotation via drag
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startRot, setStartRot] = useState(0);

  const img = order.model ? IMAGES[order.model] : imageSrc(oxford);
  const meta = order.model ? MODEL_META[order.model] : MODEL_META.oxford;

  const filter = `${tonalityImageFilter(order.color)} brightness(1.05) contrast(1.02)`.trim();

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    setStartX(e.clientX);
    setStartRot(rotation);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setRotation(startRot + (e.clientX - startX) * 0.4);
  };
  const onPointerUp = () => setDragging(false);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2 }}
      className="absolute inset-0 flex flex-col items-center justify-center"
    >
      {onBack ? <BackButton onClick={onBack} /> : null}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 42% at 50% 38%, ${REVEAL.ambient} 0%, transparent 72%)`,
        }}
      />

      <div className="absolute top-20 z-20 text-center">
        <p className="tracking-whisper" style={{ color: REVEAL.eyebrow }}>
          Finaler Blick
        </p>
      </div>

      {/* Two shoes - left and right (slightly different per scan) */}
      <div
        className="relative z-10 flex select-none touch-none items-center justify-center gap-8 md:gap-16"
        style={{ cursor: dragging ? "grabbing" : "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {[0, 1].map((i) => (
          <motion.img
            key={i}
            src={img}
            alt={meta.name}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2, delay: 0.3 + i * 0.3 }}
            draggable={false}
            className="pointer-events-none max-h-[40vh] max-w-[40%] object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.5)]"
            style={{
              filter: `${filter}${order.finish === "polished" ? " contrast(1.08)" : ""}`,
              transform: `${i === 1 ? "scaleX(-1) " : ""}rotateY(${rotation}deg)`,
              transition: dragging ? "none" : "transform 0.6s ease",
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2, delay: 1.2 }}
        className="absolute bottom-36 z-20 px-8 text-center"
      >
        <p
          className="tracking-whisper mb-4"
          style={{ color: REVEAL.meta }}
        >
          {COLOR_META[order.color].name} · {order.leather} · {order.finish}
        </p>
        <p
          className="font-display text-6xl italic md:text-7xl"
          style={{ color: REVEAL.title, textShadow: REVEAL.titleShadow }}
        >
          Ein Unikat.
        </p>
        {order.signature && (
          <p
            className="font-display mt-4 text-xl italic"
            style={{ color: REVEAL.signature }}
          >
            — graviert «{order.signature}»
          </p>
        )}
        <p
          className="mt-6 text-[0.55rem] uppercase tracking-[0.4em]"
          style={{ color: REVEAL.hint }}
        >
          · ziehen zum drehen ·
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 2 }}
        onClick={onContinue}
        className="group absolute bottom-12 z-20 tracking-atelier transition-opacity hover:opacity-95"
        style={{ color: REVEAL.cta }}
      >
        <span
          className="border-b pb-2 transition-colors group-hover:border-[oklch(0.99_0.022_85/0.55)]"
          style={{ borderColor: REVEAL.ctaBorder }}
        >
          Zur Bestellung
        </span>
      </motion.button>
    </motion.section>
  );
}
