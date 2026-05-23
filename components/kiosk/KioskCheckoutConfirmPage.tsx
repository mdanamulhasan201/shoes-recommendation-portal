"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  clearKioskCheckoutDeliveryAddress,
  readKioskFlowState,
} from "@/app/kiosk/flow-state";
import { createReferenceCheckoutSession } from "@/api/referenceCheckoutApi";
import {
  deliveryAddressToOrderSnapshot,
  fetchAllDeliveryAddressesMerged,
} from "@/api/premium/premiumDeliveryAddressApi";
import { fetchAllMyCardsMerged } from "@/api/referenceCustomerCardApi";
import { KioskTopBar } from "@/components/kiosk/KioskTopBar";
import { KIOSK_SHOE_DETAIL_ACCENT } from "@/components/recommendations/shoe-detail/constants";

function resolveCustomerId(): string | null {
  const pid = readKioskFlowState().profile?.id;
  const s =
    pid !== undefined && pid !== null && String(pid).trim() !== ""
      ? String(pid).trim()
      : "";
  return s || null;
}

export function KioskCheckoutConfirmPage() {
  const router = useRouter();
  const [entered, setEntered] = useState(false);
  const [delivery, setDelivery] = useState(
    () => readKioskFlowState().checkoutDeliveryAddress ?? null,
  );
  const [cardIds, setCardIds] = useState<string[]>([]);
  const [bootLoading, setBootLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const flow = readKioskFlowState();
  const recipientEmail = flow.profile?.email?.trim() ?? "";

  useEffect(() => {
    queueMicrotask(() => setEntered(true));
  }, []);

  useEffect(() => {
    if (delivery?.id) return;
    const customerId = resolveCustomerId();
    if (!customerId) return;

    let cancelled = false;
    void (async () => {
      try {
        const rows = await fetchAllDeliveryAddressesMerged(customerId, 20);
        const selected = rows.find(r => r.isSelected) ?? rows[0];
        if (!cancelled && selected) {
          setDelivery(deliveryAddressToOrderSnapshot(selected));
        }
      } catch {
        /* optional hydrate */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [delivery?.id]);

  const loadCartLineIds = useCallback(async () => {
    const customerId = resolveCustomerId();
    const fromFlow = readKioskFlowState().checkoutCardIds ?? [];

    if (!customerId) {
      setCardIds(fromFlow);
      setCheckoutError(
        fromFlow.length
          ? null
          : "Kein Kundenprofil — bitte Kiosk-Flow erneut starten.",
      );
      setBootLoading(false);
      return;
    }

    setBootLoading(true);
    setCheckoutError(null);
    try {
      let ids = fromFlow
        .map(id => String(id).trim())
        .filter(Boolean);
      if (ids.length === 0) {
        const cards = await fetchAllMyCardsMerged(customerId, 50);
        ids = cards
          .map(c => (c.id ? String(c.id).trim() : ""))
          .filter(Boolean);
      }
      setCardIds(ids);
      if (ids.length === 0) {
        setCheckoutError("Warenkorb ist leer — bitte Artikel hinzufügen.");
      }
    } catch (e) {
      setCardIds(fromFlow);
      setCheckoutError(
        e instanceof Error
          ? e.message
          : "Warenkorb konnte nicht geladen werden.",
      );
    } finally {
      setBootLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCartLineIds();
  }, [loadCartLineIds]);

  const addressId = delivery?.id?.trim() ?? "";

  const canPay = useMemo(
    () => !bootLoading && cardIds.length > 0 && Boolean(addressId),
    [bootLoading, cardIds.length, addressId],
  );

  const goToStripeCheckout = useCallback(async () => {
    if (!canPay) {
      if (!addressId) {
        toast.error("Lieferadresse fehlt — bitte zurück zur Adresse.", {
          id: "kiosk-checkout-no-addr",
          duration: 4000,
        });
        router.push("/kiosk/checkout");
        return;
      }
      if (cardIds.length === 0) {
        toast.error("Warenkorb ist leer.", { id: "kiosk-checkout-empty" });
      }
      return;
    }

    setPayLoading(true);
    setCheckoutError(null);
    try {
      const url = await createReferenceCheckoutSession({
        card_ids: cardIds,
        delevery_address_id: addressId,
      });
      window.location.assign(url);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : "Checkout konnte nicht gestartet werden.";
      setCheckoutError(msg);
      toast.error(msg, { id: "kiosk-checkout-err", duration: 4500 });
    } finally {
      setPayLoading(false);
    }
  }, [canPay, cardIds, addressId, router]);

  const handleReset = () => {
    clearKioskCheckoutDeliveryAddress();
    router.push("/kiosk");
  };

  return (
    <section
      className="relative flex h-dvh max-h-dvh min-h-0 w-full flex-col overflow-hidden bg-[#050505] text-white"
      aria-label="Bestätigung"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--primary)/0.06)_0%,transparent_50%)]" />

      <div
        className="relative z-10 flex min-h-0 w-full flex-1 flex-col"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
      >
        <div className="w-full shrink-0 border-b border-white/[0.06] bg-[#050505]/90 backdrop-blur-md">
          <KioskTopBar
            onBack={() => router.push("/kiosk/checkout")}
            cartCount={cardIds.length}
            warenkorbDecorativeOnly
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
          <div
            className="mx-auto flex w-full max-w-[720px] flex-col px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6"
            style={{
              opacity: entered ? 1 : 0,
              transform: entered ? "translateY(0)" : "translateY(12px)",
              transition: "opacity 380ms ease-out, transform 380ms ease-out",
            }}
          >
            <div className="mt-5 text-center sm:mt-8">
              <p
                className="kiosk-mono text-[10px] font-bold tracking-[0.28em]"
                style={{ color: KIOSK_SHOE_DETAIL_ACCENT }}
              >
                BESTÄTIGUNG
              </p>
              <h1 className="kiosk-display mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">
                Fast geschafft
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm text-white/50">
                Lieferung direkt zu Ihnen — Zahlung sicher über Stripe.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <SummaryTile label="Artikel" value={`${cardIds.length} im Warenkorb`} />
              <SummaryTile label="Zahlung" value="Stripe Checkout" />
            </div>

            {delivery ? (
              <div
                className="mt-8 rounded-2xl border border-white/[0.08] bg-[#141820]/90 p-4 text-left sm:p-5"
                style={{
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.35)",
                }}
              >
                <p className="kiosk-mono text-[10px] tracking-[0.2em] text-white/45">
                  LIEFERADRESSE
                </p>
                <p className="mt-2 text-base font-semibold text-white">
                  {delivery.description || "Adresse"}
                </p>
                <p className="mt-2 text-sm text-white/70">{delivery.phone}</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/55">
                  {delivery.address}
                </p>
              </div>
            ) : (
              <p className="mt-8 text-center text-sm text-amber-300/90" role="alert">
                Keine Lieferadresse — bitte zurück und Adresse wählen.
              </p>
            )}

            {recipientEmail ? (
              <p className="mt-6 text-center text-xs tracking-[0.12em] text-white/40">
                Bestätigung per E-Mail an {recipientEmail}
              </p>
            ) : null}

            {checkoutError ? (
              <div className="mt-6 text-center">
                <p className="text-xs text-amber-300/90" role="alert">
                  {checkoutError}
                </p>
                <button
                  type="button"
                  onClick={() => void loadCartLineIds()}
                  className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/55 hover:text-white"
                >
                  Erneut laden
                </button>
              </div>
            ) : null}

            <button
              type="button"
              disabled={!canPay || bootLoading}
              onClick={() => void goToStripeCheckout()}
              className="mt-10 w-full cursor-pointer rounded-full py-4 text-center text-sm font-bold tracking-[0.14em] text-white transition-all disabled:cursor-not-allowed disabled:opacity-35"
              style={{
                background: KIOSK_SHOE_DETAIL_ACCENT,
                boxShadow: "0 12px 32px rgba(96,164,133,0.28)",
              }}
            >
              {payLoading
                ? "Weiterleitung…"
                : bootLoading
                  ? "Warenkorb wird geladen…"
                  : "JETZT BEZAHLEN"}
            </button>
            <p className="mt-4 text-center text-[10px] tracking-[0.16em] text-white/35">
              {canPay
                ? "Startet Stripe mit Warenkorb-Zeilen und Lieferadresse."
                : "Warenkorb und Lieferadresse werden benötigt."}
            </p>

            <button
              type="button"
              onClick={handleReset}
              className="mx-auto mt-6 cursor-pointer border-none bg-transparent text-xs font-medium tracking-[0.16em] text-white/40 underline-offset-4 transition-colors hover:text-white/65"
            >
              KIOSK NEU STARTEN
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-4">
      <p className="kiosk-mono text-[10px] tracking-[0.18em] text-white/45">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white/90">{value}</p>
    </div>
  );
}
