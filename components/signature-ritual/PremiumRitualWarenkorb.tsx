"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { readKioskFlowState } from "@/app/kiosk/flow-state";
import {
  deletePremiumCardsBulk,
  fetchAllPremiumCardsMerged,
  patchPremiumCardQuantityStep,
  premiumCardArticleCount,
  type PremiumCardItem,
} from "@/api/premium/premiumShoeCardApi";
import { resolveShoeImageSrc } from "@/api/shoeImageSrc";
import { BackButton } from "@/components/signature-ritual/atelier/BackButton";
import { ritualPath } from "@/components/signature-ritual/routes";

function resolveCustomerId(): string | null {
  const pid = readKioskFlowState().profile?.id;
  const s =
    pid !== undefined && pid !== null && String(pid).trim() !== ""
      ? String(pid).trim()
      : "";
  return s || null;
}

/** Warenkorb — bright copy; product thumbnails stay clear */
const CART = {
  eyebrow: "oklch(0.9 0.095 75)",
  title: "oklch(0.99 0.022 85)",
  titleShadow:
    "0 0 32px oklch(0.9 0.11 78 / 0.3), 0 2px 12px rgba(0,0,0,0.18)",
  subtitle: "oklch(0.84 0.035 75)",
  muted: "oklch(0.8 0.03 72)",
  lineTitle: "oklch(0.98 0.02 85)",
  lineMeta: "oklch(0.78 0.03 72)",
  price: "oklch(0.93 0.11 78)",
  panelBorder: "oklch(0.92 0.02 80 / 0.22)",
  panelBg: "oklch(0.06 0.004 60 / 0.42)",
  thumbBorder: "oklch(0.9 0.04 78 / 0.28)",
  thumbBg: "oklch(0.08 0.005 60 / 0.55)",
  cta: "oklch(0.93 0.11 78)",
  link: "oklch(0.82 0.04 75)",
} as const;

function formatEur(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(Number.isFinite(amount) ? amount : 0);
}

function lineImage(row: PremiumCardItem): string | null {
  const colorImg = row.leather_color?.image?.trim();
  if (colorImg) return resolveShoeImageSrc(colorImg);
  const modelImg = row.premium_reference_shoe?.model_image?.trim();
  if (modelImg) return resolveShoeImageSrc(modelImg);
  return null;
}

function lineUnitPrice(row: PremiumCardItem): number {
  const p = row.price;
  return typeof p === "number" && Number.isFinite(p) ? p : 0;
}

type DeleteModalState = null | { mode: "single"; index: number } | { mode: "all" };

function PremiumQtyEditor({
  quantity,
  rowBusy,
  onBump,
}: {
  quantity: number;
  rowBusy: boolean;
  onBump: (delta: -1 | 1) => void;
}) {
  const qty = quantity >= 1 ? quantity : 1;
  const minusDisabled = rowBusy || qty <= 1;
  const plusDisabled = rowBusy || qty >= 999;

  return (
    <motion.div
      className="mt-3 inline-flex items-center gap-2 rounded-full border px-1 py-1"
      style={{
        borderColor: CART.panelBorder,
        backgroundColor: CART.panelBg,
      }}
    >
      <button
        type="button"
        disabled={minusDisabled}
        onClick={() => onBump(-1)}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-ivory/10 disabled:cursor-not-allowed disabled:opacity-35"
        style={{ color: CART.lineTitle }}
        aria-label="Menge verringern"
      >
        −
      </button>
      <span
        className="min-w-[2rem] text-center font-sans text-sm tabular-nums"
        style={{ color: CART.lineTitle }}
      >
        {qty}
      </span>
      <button
        type="button"
        disabled={plusDisabled}
        onClick={() => onBump(1)}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-ivory/10 hover:text-[oklch(0.93_0.11_78)] disabled:cursor-not-allowed disabled:opacity-35"
        style={{ color: CART.lineTitle }}
        aria-label="Menge erhöhen"
      >
        +
      </button>
    </motion.div>
  );
}

export function PremiumRitualWarenkorb() {
  const router = useRouter();
  const [lines, setLines] = useState<PremiumCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyCardId, setBusyCardId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>(null);
  const [bulkDeleteBusy, setBulkDeleteBusy] = useState(false);
  const skipEventHydrate = useRef(false);

  const reload = useCallback(async (customerId: string) => {
    const rows = await fetchAllPremiumCardsMerged(customerId, 20);
    skipEventHydrate.current = true;
    setLines(rows);
  }, []);

  const hydrate = useCallback(async () => {
    const cid = resolveCustomerId();
    setLoading(true);
    setActionError(null);
    if (!cid) {
      setLines([]);
      setLoading(false);
      return;
    }
    try {
      await reload(cid);
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Warenkorb konnte nicht geladen werden.",
      );
      setLines([]);
    } finally {
      setLoading(false);
    }
  }, [reload]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onCh = () => {
      if (skipEventHydrate.current) {
        skipEventHydrate.current = false;
        return;
      }
      void hydrate();
      window.setTimeout(() => void hydrate(), 400);
    };
    window.addEventListener("premium-warenkorb-changed", onCh);
    return () => window.removeEventListener("premium-warenkorb-changed", onCh);
  }, [hydrate]);

  const articleCount = useMemo(() => premiumCardArticleCount(lines), [lines]);

  const cartTotal = useMemo(() => {
    return lines.reduce((sum, row) => {
      const unit = lineUnitPrice(row);
      const q =
        typeof row.quantity === "number" && row.quantity >= 1
          ? row.quantity
          : 1;
      return sum + unit * q;
    }, 0);
  }, [lines]);

  const customerPresent = Boolean(resolveCustomerId());

  const bumpQuantity = useCallback(
    async (index: number, delta: -1 | 1) => {
      const row = lines[index];
      const cardId = row?.id ? String(row.id).trim() : "";
      if (!cardId) return;
      const cid = resolveCustomerId();
      if (!cid) return;

      const qty = row.quantity && row.quantity >= 1 ? row.quantity : 1;
      if (delta < 0 && qty <= 1) return;

      setBusyCardId(cardId);
      setActionError(null);
      try {
        await patchPremiumCardQuantityStep(
          cardId,
          delta > 0 ? "increment" : "decrement",
        );
        await reload(cid);
        toast.success(delta > 0 ? "Menge erhöht" : "Menge verringert", {
          id: "premium-line-qty",
          duration: 2200,
        });
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Menge konnte nicht geändert werden.";
        toast.error(msg, { id: "premium-line-qty-err", duration: 4000 });
      } finally {
        setBusyCardId(null);
      }
    },
    [lines, reload],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteModal) return;
    const cid = resolveCustomerId();
    if (!cid) {
      setDeleteModal(null);
      return;
    }

    setBulkDeleteBusy(true);
    setActionError(null);
    try {
      if (deleteModal.mode === "single") {
        const row = lines[deleteModal.index];
        const id = row?.id ? String(row.id).trim() : "";
        if (!id) {
          setDeleteModal(null);
          return;
        }
        setBusyCardId(id);
        await deletePremiumCardsBulk([id]);
        await reload(cid);
        toast.success("Artikel entfernt", { id: "premium-remove", duration: 2200 });
      } else {
        const ids = lines
          .map((l) => (l.id ? String(l.id).trim() : ""))
          .filter(Boolean);
        if (ids.length === 0) {
          setLines([]);
        } else {
          const resp = await deletePremiumCardsBulk(ids);
          const dc = resp.data?.deletedCount ?? ids.length;
          toast.success(
            dc === 1 ? "Artikel entfernt" : `${dc} Artikel entfernt`,
            { id: "premium-remove", duration: 2400 },
          );
          await reload(cid);
        }
      }
      setDeleteModal(null);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : "Warenkorb konnte nicht aktualisiert werden.";
      setActionError(msg);
      toast.error(msg, { id: "premium-remove-err", duration: 4000 });
    } finally {
      setBulkDeleteBusy(false);
      setBusyCardId(null);
    }
  }, [deleteModal, lines, reload]);

  const showEmpty = !loading && lines.length === 0;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0 grid grid-rows-[1fr] overflow-hidden"
    >
      <BackButton onClick={() => router.back()} />

      <div className="flex min-h-0 flex-col overflow-y-auto overscroll-y-contain px-6 pb-12 pt-20 md:px-12 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15 }}
          className="mx-auto w-full max-w-xl text-center"
        >
          <p
            className="tracking-whisper text-[0.65rem]"
            style={{ color: CART.eyebrow }}
          >
            — Warenkorb —
          </p>
          <h1
            className="font-display mt-3 text-2xl italic md:text-3xl"
            style={{ color: CART.title, textShadow: CART.titleShadow }}
          >
            {articleCount} {articleCount === 1 ? "Artikel" : "Artikel"}
          </h1>
          {customerPresent ? (
            <p
              className="mx-auto mt-2 max-w-md text-xs tracking-wide"
              style={{ color: CART.subtitle }}
            >
              Mit Kundenprofil — Premium-Warenkorb
            </p>
          ) : (
            <p className="mt-2 text-xs text-amber-200/80" role="alert">
              Kein Kundenprofil — bitte den Kiosk-Flow vom Start durchlaufen.
            </p>
          )}
          {actionError ? (
            <p className="mt-3 text-xs text-amber-200/90" role="alert">
              {actionError}
            </p>
          ) : null}
          {lines.length > 0 && !loading ? (
            <button
              type="button"
              onClick={() => setDeleteModal({ mode: "all" })}
              className="mx-auto mt-5 text-[0.58rem] font-medium uppercase tracking-[0.2em] text-red-400/70 transition-colors hover:text-red-300"
            >
              Alle Artikel entfernen
            </button>
          ) : null}
        </motion.div>

        <div className="mx-auto mt-10 flex w-full max-w-xl flex-col gap-4">
          {loading && lines.length === 0 ? (
            <p
              className="rounded-sm border px-5 py-10 text-center text-xs uppercase tracking-[0.2em]"
              style={{
                color: CART.muted,
                borderColor: CART.panelBorder,
                backgroundColor: CART.panelBg,
              }}
            >
              Warenkorb wird geladen…
            </p>
          ) : null}

          {showEmpty ? (
            <p
              className="rounded-sm border px-5 py-10 text-center text-xs uppercase tracking-[0.2em]"
              style={{
                color: CART.muted,
                borderColor: CART.panelBorder,
                backgroundColor: CART.panelBg,
              }}
            >
              Der Warenkorb ist leer.
            </p>
          ) : null}

          {lines.map((row, i) => {
            const cardId = row.id ? String(row.id).trim() : `row-${i}`;
            const qty =
              typeof row.quantity === "number" && row.quantity >= 1
                ? row.quantity
                : 1;
            const unit = lineUnitPrice(row);
            const lineTotal = unit * qty;
            const shoe = row.premium_reference_shoe;
            const color = row.leather_color;
            const modelName = shoe?.model_name?.trim() || "Schuh";
            const colorName = color?.name?.trim() || "—";
            const variantName = color?.product_variant?.name?.trim();
            const img = lineImage(row);
            const rowBusy = busyCardId === cardId;

            return (
              <motion.div
                key={cardId}
                layout
                className="flex items-start gap-4 rounded-sm border p-4 shadow-[inset_0_1px_0_oklch(0.92_0.06_78/0.08)] md:p-5"
                style={{
                  opacity: rowBusy ? 0.65 : 1,
                  borderColor: CART.panelBorder,
                  backgroundColor: CART.panelBg,
                }}
              >
                <div
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-sm border md:h-[72px] md:w-[72px]"
                  style={{
                    borderColor: CART.thumbBorder,
                    backgroundColor: CART.thumbBg,
                  }}
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-contain object-center"
                      style={{
                        filter: "brightness(1.05) contrast(1.02)",
                      }}
                      draggable={false}
                    />
                  ) : (
                    <div
                      className="flex h-full items-center justify-center text-[10px]"
                      style={{ color: CART.muted }}
                    >
                      —
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="font-display text-base italic md:text-lg"
                    style={{ color: CART.lineTitle }}
                  >
                    {modelName} · {colorName}
                  </p>
                  {variantName ? (
                    <p
                      className="mt-1 text-[0.65rem] uppercase tracking-[0.16em]"
                      style={{ color: CART.lineMeta }}
                    >
                      {variantName}
                    </p>
                  ) : null}
                  <PremiumQtyEditor
                    quantity={qty}
                    rowBusy={rowBusy}
                    onBump={(d) => void bumpQuantity(i, d)}
                  />
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <p
                    className="font-sans text-sm tabular-nums md:text-base"
                    style={{ color: CART.price }}
                  >
                    {formatEur(lineTotal)}
                  </p>
                  <button
                    type="button"
                    disabled={rowBusy}
                    onClick={() => setDeleteModal({ mode: "single", index: i })}
                    aria-label="Entfernen"
                    className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
                    style={{
                      borderColor: CART.panelBorder,
                      color: CART.lineMeta,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M6 6l12 12M18 6L6 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div
          className="mx-auto mt-8 flex w-full max-w-xl items-baseline justify-between border-t pt-6"
          style={{ borderColor: CART.panelBorder }}
        >
          <span
            className="text-[0.58rem] uppercase tracking-[0.22em]"
            style={{ color: CART.muted }}
          >
            In total
          </span>
          <span
            className="font-display text-2xl italic tabular-nums md:text-3xl"
            style={{ color: CART.title }}
          >
            {formatEur(cartTotal)}
          </span>
        </div>

        <motion.div className="mx-auto mt-10 flex w-full max-w-xl flex-col items-center gap-4">
          <button
            type="button"
            disabled={lines.length === 0 || loading}
            onClick={() => router.push(ritualPath("checkout"))}
            className="w-full rounded-full border py-4 font-sans text-[0.62rem] font-medium uppercase tracking-[0.32em] transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-35"
            style={{
              color: CART.cta,
              borderColor: "oklch(0.93 0.11 78 / 0.55)",
              backgroundColor: "oklch(0.93 0.11 78 / 0.18)",
            }}
          >
            Zur Kasse
          </button>
          <button
            type="button"
            onClick={() => router.push(ritualPath("customize"))}
            className="text-[0.58rem] uppercase tracking-[0.22em] text-[oklch(0.82_0.04_75)] transition-colors hover:text-[oklch(0.9_0.095_75)]"
          >
            Weiter stöbern
          </button>
        </motion.div>
      </div>

      {deleteModal ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
          role="presentation"
          onClick={() => {
            if (!bulkDeleteBusy) setDeleteModal(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-[101] w-full max-w-sm rounded-sm border border-ivory/12 bg-[#0c0a08] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="font-display text-lg italic"
              style={{ color: CART.title }}
            >
              Entfernen bestätigen
            </h2>
            <p className="mt-3 text-sm" style={{ color: CART.subtitle }}>
              {deleteModal.mode === "all"
                ? `Alle ${lines.length} Artikel aus dem Warenkorb entfernen?`
                : "Diesen Artikel aus dem Warenkorb entfernen?"}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={bulkDeleteBusy}
                onClick={() => setDeleteModal(null)}
                className="flex-1 rounded-full border py-3 text-xs uppercase tracking-[0.18em] hover:bg-ivory/5 disabled:opacity-45"
                style={{
                  color: CART.lineTitle,
                  borderColor: CART.panelBorder,
                }}
              >
                Abbrechen
              </button>
              <button
                type="button"
                disabled={bulkDeleteBusy}
                onClick={() => void confirmDelete()}
                className="flex-1 rounded-full border border-red-500/40 bg-red-500/10 py-3 text-xs uppercase tracking-[0.18em] text-red-200 hover:bg-red-500/20 disabled:opacity-45"
              >
                {bulkDeleteBusy ? "…" : "Entfernen"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </motion.section>
  );
}
