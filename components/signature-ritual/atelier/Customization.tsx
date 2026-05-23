import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { readKioskFlowState } from "@/app/kiosk/flow-state";
import {
  notifyPremiumWarenkorbChanged,
  postPremiumShoeAddToCard,
} from "@/api/premium/premiumShoeCardApi";
import { BackButton } from "@/components/signature-ritual/atelier/BackButton";
import { usePremiumWarenkorbArticleCount } from "@/components/signature-ritual/usePremiumWarenkorbArticleCount";
import type { BespokeOrder, PatinaTechnique } from "@/components/signature-ritual/atelier/types";
import type { LeatherTypeRow } from "@/api/premium/premiumShoeApi";
import {
  colorsFromVariant,
  standardColorsForLeatherType,
} from "@/api/premium/premiumShoeApi";
import {
  apiColorToTone,
  variantDisplayLabels,
  variantPreviewStyle,
  type CustomizationTone,
} from "@/app/lib/premiumShoeMappers";
import {
  COLOR_META,
  LEATHER_TONALITIES,
  MODEL_META,
} from "@/components/signature-ritual/atelier/types";
import { imageSrc } from "@/components/signature-ritual/atelier/imageSrc";

import oxford from "@/assets/shoe-oxford.png";
import derby from "@/assets/shoe-derby.png";
import loafer from "@/assets/shoe-loafer.png";
import sneaker from "@/assets/shoe-sneaker.png";

import monkObsidian from "@/assets/monk-obsidian.png";
import monkCognac from "@/assets/monk-cognac.png";
import monkOxblood from "@/assets/monk-oxblood.png";
import monkIvory from "@/assets/monk-ivory.png";
import monkOlive from "@/assets/monk-olive.png";

const MONK_BY_COLOR: Record<BespokeOrder["color"], string> = {
  black: imageSrc(monkObsidian),
  "dark-brown": imageSrc(monkObsidian),
  "medium-brown": imageSrc(monkCognac),
  cognac: imageSrc(monkCognac),
  "light-brown": imageSrc(monkIvory),
  mustard: imageSrc(monkCognac),
  burgundy: imageSrc(monkOxblood),
  red: imageSrc(monkOxblood),
  forest: imageSrc(monkOlive),
  olive: imageSrc(monkOlive),
  grey: imageSrc(monkObsidian),
  "dark-blue": imageSrc(monkObsidian),
  navy: imageSrc(monkObsidian),
};

const FALLBACK = {
  oxford: imageSrc(oxford),
  derby: imageSrc(derby),
  loafer: imageSrc(loafer),
  sneaker: imageSrc(sneaker),
} as const;

/** Customize screen — brighter gold / ivory for kiosk legibility */
const CUSTOMIZE = {
  eyebrow: "oklch(0.9 0.095 75)",
  title: "oklch(0.99 0.022 85)",
  titleShadow:
    "0 0 40px oklch(0.9 0.11 78 / 0.4), 0 2px 14px rgba(0,0,0,0.2)",
  body: "oklch(0.84 0.035 75)",
  accent: "oklch(0.9 0.095 75)",
  labelActive: "oklch(0.93 0.11 78)",
  labelIdle: "oklch(0.9 0.03 82 / 0.9)",
  subMuted: "oklch(0.78 0.03 72 / 0.78)",
  whisper: "oklch(0.86 0.04 75 / 0.72)",
  empty: "oklch(0.8 0.03 72 / 0.75)",
  cta: "oklch(0.93 0.11 78)",
  ctaBorder: "oklch(0.93 0.11 78 / 0.65)",
  ctaDisabled: "oklch(0.88 0.02 80 / 0.35)",
  swatchGlow: "oklch(0.92 0.11 78 / 0.32)",
} as const;

type Tone = {
  id: string;
  name: string;
  whisper: string;
  hex: string;
  texture: string;
  previewImageUrl?: string | null;
};

const GRAIN_FINE =
  "repeating-radial-gradient(circle at 22% 28%, rgba(255,235,200,0.035) 0 1px, transparent 1px 4px)";
const GRAIN_PORES =
  "radial-gradient(circle at 72% 28%, rgba(0,0,0,0.28), transparent 58%), radial-gradient(circle at 22% 78%, rgba(0,0,0,0.32), transparent 62%)";
const SHEEN =
  "linear-gradient(135deg, rgba(255,235,205,0.10) 0%, rgba(255,235,205,0) 38%, rgba(0,0,0,0.22) 100%)";
const CLOUDING =
  "radial-gradient(ellipse 60% 45% at 30% 35%, rgba(255,235,205,0.07), transparent 65%), radial-gradient(ellipse 50% 40% at 75% 70%, rgba(0,0,0,0.22), transparent 70%)";

const calfTexture = (hex: string) =>
  `${SHEEN}, ${CLOUDING}, ${GRAIN_PORES}, ${GRAIN_FINE}, radial-gradient(ellipse at 42% 38%, ${hex} 0%, ${hex} 55%, ${hex}dd 80%, ${hex}aa 100%)`;

const marbleTexture = (hex: string) =>
  `${SHEEN}, repeating-linear-gradient(118deg, rgba(255,240,210,0.10) 0 1px, transparent 1px 6px, rgba(0,0,0,0.18) 6px 7px, transparent 7px 14px), radial-gradient(ellipse at 25% 30%, rgba(255,220,170,0.18), transparent 55%), radial-gradient(ellipse at 70% 70%, rgba(0,0,0,0.5), transparent 60%), linear-gradient(140deg, ${hex} 0%, #0a0604 100%)`;

const papiroTexture = (hex: string) =>
  `${SHEEN}, radial-gradient(ellipse at 30% 30%, rgba(255,235,200,0.18), transparent 55%), radial-gradient(ellipse at 75% 70%, rgba(60,30,10,0.45), transparent 60%), repeating-radial-gradient(circle at 50% 50%, rgba(0,0,0,0.05) 0 2px, transparent 2px 5px), radial-gradient(ellipse at 50% 50%, ${hex}, ${hex}cc 70%)`;

const museumTexture = (hex: string) =>
  `${SHEEN}, radial-gradient(ellipse at 30% 70%, rgba(120,60,20,0.35), transparent 55%), radial-gradient(ellipse at 70% 25%, rgba(0,0,0,0.6), transparent 65%), repeating-radial-gradient(circle at 60% 40%, rgba(0,0,0,0.18) 0 1px, transparent 1px 4px), linear-gradient(160deg, ${hex} 0%, #060302 100%)`;

const TEXTURE_FOR: Record<PatinaTechnique | "standard", (hex: string) => string> = {
  standard: calfTexture,
  marble: marbleTexture,
  papiro: papiroTexture,
  regular: calfTexture,
  museum: museumTexture,
};

const STANDARD_TONES: Tone[] = LEATHER_TONALITIES.map((id) => ({
  id,
  name: COLOR_META[id].name,
  whisper: COLOR_META[id].whisper,
  hex: COLOR_META[id].hex,
  texture: calfTexture(COLOR_META[id].hex),
}));

const PATINA_TECHNIQUES: {
  id: PatinaTechnique;
  name: string;
  whisper: string;
  preview: string;
}[] = [
  {
    id: "marble",
    name: "Marble",
    whisper: "Organische Tiefe",
    preview:
      "linear-gradient(135deg, rgba(255,235,210,0.06) 0%, rgba(0,0,0,0.35) 100%), radial-gradient(ellipse 60% 40% at 30% 35%, rgba(70,42,28,0.55), transparent 70%), radial-gradient(ellipse 50% 35% at 75% 70%, rgba(0,0,0,0.7), transparent 65%), radial-gradient(ellipse 30% 25% at 60% 25%, rgba(120,80,50,0.25), transparent 70%), linear-gradient(160deg, #1a120c 0%, #0a0604 100%)",
  },
  {
    id: "papiro",
    name: "Papiro",
    whisper: "Feine Schichtung",
    preview:
      "linear-gradient(135deg, rgba(255,235,210,0.05) 0%, rgba(0,0,0,0.25) 100%), repeating-linear-gradient(102deg, rgba(255,225,190,0.05) 0 1px, transparent 1px 4px, rgba(0,0,0,0.18) 4px 5px, transparent 5px 9px), radial-gradient(ellipse at 30% 40%, rgba(90,60,38,0.35), transparent 65%), linear-gradient(150deg, #1c1410 0%, #0c0805 100%)",
  },
  {
    id: "regular",
    name: "Regular",
    whisper: "Klassische Balance",
    preview:
      "linear-gradient(140deg, rgba(255,235,205,0.08) 0%, rgba(255,235,205,0) 45%, rgba(0,0,0,0.4) 100%), radial-gradient(ellipse at 38% 38%, rgba(80,52,32,0.3), transparent 70%), linear-gradient(155deg, #1a120d 0%, #0c0805 100%)",
  },
  {
    id: "museum",
    name: "Museum",
    whisper: "Gealterte Intensität",
    preview:
      "linear-gradient(135deg, rgba(255,225,185,0.07) 0%, rgba(0,0,0,0.5) 100%), radial-gradient(ellipse 55% 40% at 28% 70%, rgba(85,50,28,0.4), transparent 60%), radial-gradient(ellipse 45% 35% at 75% 25%, rgba(0,0,0,0.85), transparent 65%), repeating-radial-gradient(circle at 60% 45%, rgba(0,0,0,0.18) 0 1px, transparent 1px 5px), linear-gradient(165deg, #14100a 0%, #050302 100%)",
  },
];

const PATINA_COLORS: { id: string; name: string; whisper: string; hex: string }[] = [
  { id: "denim", name: "Denim", whisper: "Verwaschenes Indigo", hex: "#3a4a66" },
  { id: "grey", name: "Grey", whisper: "Stein im Nebel", hex: "#5a5a5a" },
  { id: "cognac", name: "Cognac", whisper: "Warmes Licht", hex: "#6a3a18" },
  { id: "brown", name: "Brown", whisper: "Erdene Tiefe", hex: "#3a2010" },
  { id: "purple", name: "Purple", whisper: "Sammtene Dämmerung", hex: "#3a1a3e" },
  { id: "burgundy", name: "Burgundy", whisper: "Reifer Bordeaux", hex: "#4a0c1c" },
  { id: "khaki", name: "Khaki", whisper: "Stiller Salbei", hex: "#5a5230" },
  { id: "turquoise", name: "Turquoise", whisper: "Adriatisches Blau", hex: "#1a4a52" },
];

const buildPatinaPalette = (technique: PatinaTechnique): Tone[] =>
  PATINA_COLORS.map((c) => ({
    id: `${technique}-${c.id}`,
    name: c.name,
    whisper: c.whisper,
    hex: c.hex,
    texture: TEXTURE_FOR[technique](c.hex),
  }));

const PATINA_PALETTES: Record<PatinaTechnique, Tone[]> = {
  marble: buildPatinaPalette("marble"),
  papiro: buildPatinaPalette("papiro"),
  regular: buildPatinaPalette("regular"),
  museum: buildPatinaPalette("museum"),
};

export function Customization({
  order,
  onUpdate,
  onContinue,
  onBack,
  premiumLeatherType = null,
  premiumModelImage = null,
  premiumModelName,
  premiumFromApi = false,
  premiumReferenceShoeId,
}: {
  order: BespokeOrder;
  onUpdate: (p: Partial<BespokeOrder>) => void;
  onContinue: () => void;
  onBack?: () => void;
  premiumLeatherType?: LeatherTypeRow | null;
  premiumModelImage?: string | null;
  premiumModelName?: string;
  /** When true, never use static color rails (model step → get-details). */
  premiumFromApi?: boolean;
  /** `data.id` from premium get-details — used for add-to-card. */
  premiumReferenceShoeId?: string;
}) {
  const useApi = Boolean(premiumFromApi);
  const premiumCartCount = usePremiumWarenkorbArticleCount();
  const continueRequiresCart = useApi;
  const canContinue =
    !continueRequiresCart || premiumCartCount > 0;

  const isOxford = order.model === "oxford";
  const isPatina = useApi
    ? Boolean(premiumLeatherType?.isPatina)
    : order.finish === "patina" && !isOxford;

  const apiVariants = useMemo(
    () => premiumLeatherType?.leather_variants ?? [],
    [premiumLeatherType],
  );

  const apiPatinaVariantId =
    order.premiumPatinaVariantId ?? apiVariants[0]?.id ?? null;

  const apiStandardTones: CustomizationTone[] = useMemo(() => {
    if (!premiumLeatherType || premiumLeatherType.isPatina) return [];
    return standardColorsForLeatherType(premiumLeatherType).map(apiColorToTone);
  }, [premiumLeatherType]);

  const apiPatinaTones: CustomizationTone[] = useMemo(() => {
    if (!premiumLeatherType?.isPatina) return [];
    const variant =
      apiVariants.find((v) => v.id === apiPatinaVariantId) ?? apiVariants[0];
    if (variant) return colorsFromVariant(variant).map(apiColorToTone);
    return standardColorsForLeatherType(premiumLeatherType).map(apiColorToTone);
  }, [premiumLeatherType, apiVariants, apiPatinaVariantId]);

  useEffect(() => {
    if (useApi) return;
    if (isOxford && order.finish === "patina") {
      onUpdate({
        finish: "polished",
        patinaTechnique: undefined,
        patinaColor: undefined,
      });
    }
  }, [useApi, isOxford, order.finish, onUpdate]);

  useEffect(() => {
    if (!isPatina || useApi) return;
    if (!order.patinaTechnique) {
      onUpdate({
        patinaTechnique: "regular",
        patinaColor: PATINA_PALETTES.regular[0].id,
      });
    } else if (!order.patinaColor) {
      onUpdate({ patinaColor: PATINA_PALETTES[order.patinaTechnique][0].id });
    }
  }, [isPatina, useApi, order.patinaTechnique, order.patinaColor, onUpdate]);

  useEffect(() => {
    if (!useApi || !premiumLeatherType) return;
    if (premiumLeatherType.isPatina) {
      const variantId = apiPatinaVariantId ?? apiVariants[0]?.id;
      const variant =
        apiVariants.find((v) => v.id === variantId) ?? apiVariants[0];
      if (!variant) return;
      const colorIds = new Set(colorsFromVariant(variant).map((c) => c.id));
      const firstColor = colorsFromVariant(variant)[0]?.id;
      const patch: Partial<BespokeOrder> = {};
      if (variantId && order.premiumPatinaVariantId !== variantId) {
        patch.premiumPatinaVariantId = variantId;
      }
      const currentColor = order.premiumColorId;
      if (
        firstColor &&
        (!currentColor || !colorIds.has(currentColor))
      ) {
        patch.premiumColorId = firstColor;
        patch.patinaColor = firstColor;
      }
      if (Object.keys(patch).length) onUpdate(patch);
    } else {
      const first = apiStandardTones[0];
      if (first && !order.premiumColorId) {
        onUpdate({ premiumColorId: first.id });
      }
    }
  }, [
    useApi,
    premiumLeatherType,
    apiPatinaVariantId,
    apiVariants,
    apiStandardTones,
    order.premiumPatinaVariantId,
    order.premiumColorId,
    onUpdate,
  ]);

  const technique: PatinaTechnique | null =
    !useApi && isPatina ? (order.patinaTechnique ?? "regular") : null;

  const palette: Tone[] = useApi
    ? isPatina
      ? apiPatinaTones
      : apiStandardTones
    : isPatina && technique
      ? PATINA_PALETTES[technique]
      : STANDARD_TONES;

  const activeToneId = useApi
    ? (palette.some((t) => t.id === order.premiumColorId)
        ? order.premiumColorId!
        : (palette[0]?.id ?? ""))
    : isPatina
      ? (order.patinaColor ?? palette[0]?.id ?? "")
      : order.color;
  const activeTone =
    palette.find((t) => t.id === activeToneId) ?? palette[0] ?? null;

  const isMonk = order.model === "monk";
  const monkKey = isPatina ? "burgundy" : order.color;
  const activeColorImage =
    useApi && activeTone?.previewImageUrl ? activeTone.previewImageUrl : null;
  const baseImg = useApi
    ? activeColorImage ?? premiumModelImage ?? null
    : activeColorImage ??
      premiumModelImage ??
      (isMonk
        ? MONK_BY_COLOR[monkKey] ?? MONK_BY_COLOR.black
        : order.model && order.model !== "monk"
          ? FALLBACK[order.model as keyof typeof FALLBACK]
          : imageSrc(oxford));
  const meta = order.model ? MODEL_META[order.model] : MODEL_META.oxford;
  const displayModelName = premiumModelName?.trim() || meta.name;

  /** Color wash only for legacy fallback art — never dim premium product photos */
  const tonalWash =
    activeTone &&
    !activeColorImage &&
    !(useApi && premiumModelImage)
      ? {
          background: `radial-gradient(ellipse at 40% 40%, ${activeTone.hex}cc, ${activeTone.hex}55 60%, transparent 85%)`,
          mixBlendMode: isPatina ? ("multiply" as const) : ("soft-light" as const),
          opacity: isPatina ? 0.55 : 0.32,
        }
      : null;

  const apiVariant =
    useApi && isPatina
      ? (apiVariants.find((v) => v.id === apiPatinaVariantId) ?? apiVariants[0])
      : null;

  const sectionLabel = useApi
    ? isPatina && apiVariant
      ? `— ${apiVariant.name} Patina —`
      : "— Tonalität —"
    : isPatina && technique
      ? `— ${PATINA_TECHNIQUES.find((p) => p.id === technique)?.name} Patina —`
      : "— Tonalität —";

  const mainTitle = useApi
    ? isPatina
      ? "Die Hand des Patineurs"
      : premiumLeatherType?.name?.trim() || "Tonalität des Leders"
    : isPatina
      ? "Die Hand des Patineurs"
      : "Tonalität des Leders";

  const leatherTypeDescription =
    useApi && !isPatina ? premiumLeatherType?.description?.trim() : "";

  const [addToCartSubmitting, setAddToCartSubmitting] = useState(false);

  const canAddPremiumToCart = Boolean(
    useApi && premiumReferenceShoeId?.trim() && activeToneId,
  );

  const addPremiumToCart = useCallback(async () => {
    const shoeId = premiumReferenceShoeId?.trim();
    const leatherColorId = activeToneId?.trim();
    if (!shoeId || !leatherColorId) return;

    const flow = readKioskFlowState();
    const pid = flow.profile?.id;
    const customerId =
      pid !== undefined && pid !== null && String(pid).trim() !== ""
        ? String(pid).trim()
        : "";
    if (!customerId) {
      toast.error(
        "Kein Kundenprofil — bitte den Kiosk-Flow vom Start durchlaufen.",
        { id: "premium-add-cart-err", duration: 4500 },
      );
      return;
    }

    setAddToCartSubmitting(true);
    try {
      const resp = await postPremiumShoeAddToCard({
        customerId,
        premium_reference_shoe_id: shoeId,
        leather_color_id: leatherColorId,
        quantity: 1,
      });
      const label = activeTone?.name?.trim() || displayModelName;
      notifyPremiumWarenkorbChanged({ delta: 1 });
      toast.success(resp.message?.trim() || "Im Warenkorb", {
        description: label,
        id: "premium-add-cart",
        duration: 3200,
      });
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : "Warenkorb konnte nicht aktualisiert werden.";
      toast.error(msg, { id: "premium-add-cart-err", duration: 4500 });
    } finally {
      setAddToCartSubmitting(false);
    }
  }, [
    premiumReferenceShoeId,
    activeToneId,
    activeTone?.name,
    displayModelName,
  ]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
      className="absolute inset-0 grid grid-rows-[auto_1fr_auto]"
    >
      {onBack ? <BackButton onClick={onBack} /> : null}

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.2 }}
        className="relative z-10 px-8 pt-12 pb-8 text-center md:pb-10"
      >
        <p
          className="tracking-whisper text-[0.65rem]"
          style={{ color: CUSTOMIZE.eyebrow }}
        >
          {sectionLabel}
        </p>
        <h1
          className="font-display mt-3 text-2xl italic md:text-3xl"
          style={{ color: CUSTOMIZE.title, textShadow: CUSTOMIZE.titleShadow }}
        >
          {mainTitle}
        </h1>
        {leatherTypeDescription ? (
          <p
            className="mx-auto mt-2 max-w-md text-xs tracking-wide"
            style={{ color: CUSTOMIZE.body }}
          >
            {leatherTypeDescription}
          </p>
        ) : null}
        <p
          className={`mx-auto max-w-md text-xs tracking-wide ${
            leatherTypeDescription ? "mt-2" : "mt-2"
          }`}
          style={{ color: CUSTOMIZE.body }}
        >
          {displayModelName} ·{" "}
          <span style={{ color: CUSTOMIZE.accent }}>
            {activeTone?.name ?? activeTone?.whisper ?? "—"}
          </span>
        </p>
      </motion.div>

      <div className="relative z-10 flex min-h-0 items-center justify-center overflow-hidden px-6 py-8 md:px-10 md:py-12">
        <motion.div className="group/shoe relative z-10 my-2 max-h-[50vh] max-w-[72%] md:max-h-[48vh] md:max-w-[68%]">
          {canAddPremiumToCart ? (
            <button
              type="button"
              disabled={addToCartSubmitting}
              onClick={() => void addPremiumToCart()}
              aria-label="In den Warenkorb"
              className="absolute top-1/2 right-0 z-20 flex h-12 w-12 -translate-y-1/2 translate-x-[calc(100%+0.75rem)] items-center justify-center rounded-full border border-[oklch(0.93_0.11_78/0.45)] bg-black/55 text-[oklch(0.93_0.11_78)] opacity-100 shadow-[0_8px_28px_rgba(0,0,0,0.38)] backdrop-blur-sm transition-all duration-300 hover:border-[oklch(0.95_0.11_78/0.65)] hover:bg-black/70 hover:text-[oklch(0.99_0.022_85)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[oklch(0.9_0.11_78/0.5)] disabled:pointer-events-none disabled:opacity-40 md:h-14 md:w-14"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
                className="shrink-0"
              >
                <path
                  d="M6 7h15l-1.5 9H7.5L6 7zm0 0L5 3H2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="9" cy="20" r="1" fill="currentColor" />
                <circle cx="18" cy="20" r="1" fill="currentColor" />
              </svg>
            </button>
          ) : null}
          <AnimatePresence mode="wait">
            {baseImg ? (
              <motion.img
                key={`shoe-${activeTone?.id ?? "default"}-${baseImg}`}
                src={baseImg}
                alt={activeTone?.name ?? displayModelName}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 block max-h-[50vh] max-w-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.55)] md:max-h-[48vh]"
              />
            ) : (
              <motion.p
                key="no-shoe-image"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 text-center text-xs uppercase tracking-[0.22em]"
                style={{ color: CUSTOMIZE.empty }}
              >
                Kein Produktbild
              </motion.p>
            )}
          </AnimatePresence>

          {tonalWash && activeTone && baseImg ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${technique ?? apiPatinaVariantId ?? "std"}-${activeTone.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: tonalWash.opacity }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute inset-0"
                style={{
                  background: tonalWash.background,
                  mixBlendMode: tonalWash.mixBlendMode,
                  WebkitMaskImage: `url(${baseImg})`,
                  maskImage: `url(${baseImg})`,
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                }}
              />
            </AnimatePresence>
          ) : null}
        </motion.div>
      </div>

      <div className="relative z-10 px-6 pt-6 pb-10 md:px-12 md:pt-10">
        {isPatina && (!useApi || apiVariants.length > 0) ? (
          <div className="mb-12 flex flex-wrap justify-center gap-8 md:mb-14 md:gap-12">
            {(useApi
              ? apiVariants.map((v) => {
                  const labels = variantDisplayLabels(v);
                  return {
                    id: v.id,
                    name: labels.title,
                    whisper: labels.subtitle,
                    preview: variantPreviewStyle(v),
                  };
                })
              : PATINA_TECHNIQUES
            ).map((t) => {
              const selected = useApi
                ? apiPatinaVariantId === t.id
                : technique === t.id;
              return (
                <motion.button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    if (useApi) {
                      const variant = apiVariants.find((v) => v.id === t.id);
                      const first = variant
                        ? colorsFromVariant(variant)[0]?.id
                        : undefined;
                      onUpdate({
                        premiumPatinaVariantId: t.id,
                        premiumColorId: first,
                        patinaColor: first,
                      });
                    } else {
                      onUpdate({
                        patinaTechnique: t.id as PatinaTechnique,
                        patinaColor:
                          PATINA_PALETTES[t.id as PatinaTechnique][0].id,
                      });
                    }
                  }}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.4 }}
                  className="group relative flex flex-col items-center"
                >
                  <motion.div
                    animate={{
                      boxShadow: selected
                        ? "0 0 32px oklch(0.92 0.11 78 / 0.4), inset 0 0 0 1px oklch(0.92 0.11 78 / 0.82)"
                        : "inset 0 0 0 1px oklch(0.92 0.02 80 / 0.28)",
                    }}
                    transition={{ duration: 0.5 }}
                    className="h-16 w-28 overflow-hidden rounded-[2px] md:h-20 md:w-32"
                    style={{ backgroundImage: t.preview }}
                  />
                  <span
                    className="mt-4 font-display text-[0.85rem] italic transition-colors"
                    style={{
                      color: selected ? CUSTOMIZE.labelActive : CUSTOMIZE.labelIdle,
                    }}
                  >
                    {t.name}
                  </span>
                  <span
                    className="mt-1.5 max-w-[10rem] truncate text-[0.48rem] uppercase tracking-[0.18em] md:max-w-[12rem]"
                    style={{ color: CUSTOMIZE.whisper }}
                    title={t.whisper}
                  >
                    {t.whisper}
                  </span>
                </motion.button>
              );
            })}
          </div>
        ) : null}

        <motion.div className="mx-auto mb-10 flex max-w-5xl flex-wrap justify-center gap-6 px-4 md:gap-9">
          {palette.length === 0 ? (
            <p
              className="text-xs tracking-[0.2em] uppercase"
              style={{ color: CUSTOMIZE.empty }}
            >
              Keine Farboptionen
            </p>
          ) : null}
          {palette.map((tone) => {
            const selected = tone.id === activeToneId;
            return (
              <motion.button
                key={tone.id}
                type="button"
                onClick={() => {
                  if (useApi) {
                    onUpdate({
                      premiumColorId: tone.id,
                      patinaColor: isPatina ? tone.id : order.patinaColor,
                    });
                  } else if (isPatina) onUpdate({ patinaColor: tone.id });
                  else onUpdate({ color: tone.id as BespokeOrder["color"] });
                }}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="group flex flex-col items-center"
              >
                <div className="relative">
                  <motion.div
                    animate={{ opacity: selected ? 1 : 0 }}
                    transition={{ duration: 0.6 }}
                    className="pointer-events-none absolute -inset-2 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${CUSTOMIZE.swatchGlow}, transparent 70%)`,
                    }}
                  />
                  <motion.div
                    animate={{
                      scale: selected ? 1.04 : 1,
                      boxShadow: selected
                        ? "inset 0 0 0 1px oklch(0.92 0.11 78 / 0.95), inset 0 0 20px rgba(0,0,0,0.28)"
                        : "inset 0 0 0 1px oklch(0.92 0.02 80 / 0.22), inset 0 0 16px rgba(0,0,0,0.32)",
                    }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="relative h-16 w-16 overflow-hidden rounded-full md:h-20 md:w-20"
                    style={{
                      backgroundImage: useApi
                        ? `radial-gradient(circle at 32% 28%, color-mix(in srgb, ${tone.hex} 92%, white), ${tone.hex} 72%, color-mix(in srgb, ${tone.hex} 88%, black))`
                        : tone.texture,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      boxShadow: "inset 0 0 18px rgba(0,0,0,0.26)",
                    }}
                  />
                </div>
                <span
                  className="mt-4 font-display text-[0.82rem] italic tracking-[0.04em] transition-colors duration-500"
                  style={{
                    color: selected ? CUSTOMIZE.labelActive : CUSTOMIZE.labelIdle,
                  }}
                >
                  {tone.name}
                </span>
                <span
                  className="mt-1 text-[0.5rem] uppercase tracking-[0.22em]"
                  style={{ color: CUSTOMIZE.subMuted }}
                >
                  {tone.whisper}
                </span>
              </motion.button>
            );
          })}
        </motion.div>

        <div className="text-center">
          <button
            type="button"
            disabled={!canContinue}
            onClick={onContinue}
            title={
              !canContinue
                ? "Bitte mindestens einen Artikel in den Warenkorb legen."
                : undefined
            }
            className="tracking-atelier text-sm transition-colors hover:opacity-95"
            style={{
              color: canContinue ? CUSTOMIZE.cta : CUSTOMIZE.ctaDisabled,
              cursor: canContinue ? "pointer" : "not-allowed",
            }}
          >
            <span
              className="border-b pb-2 transition-colors"
              style={{
                borderColor: canContinue
                  ? CUSTOMIZE.ctaBorder
                  : "oklch(0.88 0.02 80 / 0.2)",
              }}
            >
              Fortfahren
            </span>
          </button>
        </div>
      </div>
    </motion.section>
  );
}
