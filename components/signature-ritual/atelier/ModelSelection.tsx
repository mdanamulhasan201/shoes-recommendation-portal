import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  extractPremiumShoeIdFromRow,
  fetchPremiumFirstView,
  modelTypeToShoeModel,
} from "@/api/premium/premiumShoeApi";
import { usePremiumShoe } from "@/components/signature-ritual/PremiumShoeContext";
import { resolveShoeImageSrc } from "@/api/shoeImageSrc";
import type { ShoeModel } from "./types";

type CarouselModel = {
  id: ShoeModel;
  apiModelType: string;
  premiumShoeId?: string;
  img: string | null;
  name: string;
};

type LoadState = "loading" | "empty" | "ready";

/** Model screen — brighter gold / ivory for kiosk legibility */
const MODEL = {
  eyebrow: "oklch(0.9 0.095 75)",
  title: "oklch(0.99 0.022 85)",
  titleShadow:
    "0 0 40px oklch(0.9 0.11 78 / 0.4), 0 2px 14px rgba(0,0,0,0.2)",
  muted: "oklch(0.82 0.04 72)",
  cta: "oklch(0.93 0.11 78)",
  dotActive: "oklch(0.92 0.11 78)",
  dotIdle: "oklch(0.92 0.02 80 / 0.38)",
} as const;

function rowsToCarousel(
  rows: Awaited<ReturnType<typeof fetchPremiumFirstView>>,
): CarouselModel[] {
  const out: CarouselModel[] = [];
  for (const row of rows) {
    const id = modelTypeToShoeModel(row.model_type);
    const name = row.model_name?.trim();
    if (!id || !name) continue;
    const fromApi = row.model_image?.trim()
      ? resolveShoeImageSrc(row.model_image)
      : null;
    const premiumShoeId = extractPremiumShoeIdFromRow(row) ?? undefined;
    out.push({
      id,
      apiModelType: String(row.model_type).trim(),
      premiumShoeId,
      img: fromApi,
      name,
    });
  }
  return out;
}

export function ModelSelection({
  onSelect,
  onBack,
  configureBusy = false,
}: {
  onSelect: (
    m: ShoeModel,
    premiumShoeId: string | undefined,
    apiModelType: string,
    carouselIndex: number,
  ) => void;
  onBack?: () => void;
  configureBusy?: boolean;
}) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [models, setModels] = useState<CarouselModel[]>([]);
  const [index, setIndex] = useState(0);
  const { setFirstViewRows } = usePremiumShoe();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await fetchPremiumFirstView();
        if (!cancelled) setFirstViewRows(rows);
        const mapped = rowsToCarousel(rows);
        if (cancelled) return;
        if (mapped.length === 0) {
          setLoadState("empty");
          setModels([]);
        } else {
          setModels(mapped);
          setIndex(0);
          setLoadState("ready");
        }
      } catch {
        if (!cancelled) {
          setLoadState("empty");
          setModels([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const safeIndex = models.length > 0 ? index % models.length : 0;
  const current = models[safeIndex];

  const next = () =>
    setIndex((i) => (models.length ? (i + 1) % models.length : 0));
  const prev = () =>
    setIndex((i) =>
      models.length ? (i - 1 + models.length) % models.length : 0,
    );

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className="absolute inset-0 flex flex-col items-center justify-center"
    >
      {onBack ? (
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, delay: 0.35, ease: "easeOut" }}
          className="absolute left-4 top-5 z-40 md:left-8 md:top-9"
        >
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer rounded-full border border-ivory/28 bg-black/28 px-5 py-2.5 font-sans text-[0.62rem] font-medium uppercase tracking-[0.42em] text-[oklch(0.93_0.11_78)] shadow-[0_12px_40px_-8px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-300 hover:border-[oklch(0.93_0.11_78/0.55)] hover:bg-black/42 hover:text-[oklch(0.99_0.022_85)] hover:shadow-[0_16px_48px_-10px_oklch(0.9_0.11_78/0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.9_0.11_78/0.4)]"
          >
            Zurück
          </button>
        </motion.div>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2 }}
        className="absolute top-20 text-center"
      >
        <p className="tracking-whisper" style={{ color: MODEL.eyebrow }}>
          Modellauswahl
        </p>
      </motion.div>

      {loadState === "loading" ? (
        <p
          className="relative z-10 tracking-[0.25em] text-xs uppercase"
          style={{ color: MODEL.muted }}
        >
          Laden…
        </p>
      ) : null}

      {loadState === "empty" ? (
        <div className="relative z-10 px-8 text-center">
          <p
            className="font-display text-3xl italic md:text-4xl"
            style={{ color: MODEL.title, textShadow: MODEL.titleShadow }}
          >
            Data not found
          </p>
          <p
            className="mt-4 text-xs tracking-[0.2em] uppercase"
            style={{ color: MODEL.muted }}
          >
            Keine Modelle verfügbar
          </p>
        </div>
      ) : null}

      {loadState === "ready" && current ? (
        <>
          <div className="relative z-0 flex w-full max-w-5xl items-center justify-center px-12">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous"
              disabled={models.length <= 1}
              className="absolute left-4 z-10 text-3xl font-thin text-[oklch(0.88_0.1_75)] transition-colors hover:text-[oklch(0.95_0.11_78)] disabled:opacity-35"
            >
              ←
            </button>

            <div className="relative h-[55vh] w-full flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, scale: 0.9, rotateY: -20 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.9, rotateY: 20 }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  className="relative z-0 h-full w-full flex items-center justify-center"
                >
                  {current.img ? (
                    <motion.img
                      src={current.img}
                      alt={current.name}
                      animate={{ y: [0, -8, 0], rotateZ: [-1, 1, -1] }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="relative z-0 max-h-full max-w-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.55)]"
                    />
                  ) : (
                    <p
                      className="relative text-xs tracking-[0.22em] uppercase"
                      style={{ color: MODEL.muted }}
                    >
                      Kein Bild
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={next}
              aria-label="Next"
              disabled={models.length <= 1}
              className="absolute right-4 z-10 text-3xl font-thin text-[oklch(0.88_0.1_75)] transition-colors hover:text-[oklch(0.95_0.11_78)] disabled:opacity-35"
            >
              →
            </button>
          </div>

          <div className="pointer-events-none absolute bottom-24 z-30 w-full px-8 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.9 }}
                className="relative z-30"
              >
                <p
                  className="font-display text-5xl italic md:text-6xl"
                  style={{ color: MODEL.title, textShadow: MODEL.titleShadow }}
                >
                  {current.name}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="pointer-events-auto relative z-30 mt-10 flex items-center justify-center gap-3">
              {models.map((m, i) => (
                <button
                  key={`${m.id}-${i}`}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={m.name}
                  className="h-px transition-all"
                  style={{
                    width: i === safeIndex ? "48px" : "20px",
                    backgroundColor:
                      i === safeIndex ? MODEL.dotActive : MODEL.dotIdle,
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              disabled={configureBusy}
              onClick={() =>
                onSelect(
                  current.id,
                  current.premiumShoeId,
                  current.apiModelType,
                  safeIndex,
                )
              }
              className="pointer-events-auto group relative z-30 mt-12 tracking-atelier transition-colors hover:opacity-95 disabled:opacity-50"
              style={{ color: MODEL.cta }}
            >
              <span
                className="border-b pb-2 transition-colors group-hover:border-[oklch(0.99_0.022_85/0.55)]"
                style={{ borderColor: "oklch(0.93 0.11 78 / 0.65)" }}
              >
                {configureBusy ? "Lädt…" : "Dieses Modell konfigurieren"}
              </span>
            </button>
          </div>
        </>
      ) : null}
    </motion.section>
  );
}
