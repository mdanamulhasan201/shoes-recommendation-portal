"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { readKioskFlowState } from "@/app/kiosk/flow-state";
import { createPremiumCheckoutSession } from "@/api/premium/premiumCheckoutApi";
import {
  deliveryAddressToOrderSnapshot,
  fetchAllDeliveryAddressesMerged,
} from "@/api/premium/premiumDeliveryAddressApi";
import { fetchAllPremiumCardsMerged } from "@/api/premium/premiumShoeCardApi";
import { Confirmation } from "@/components/signature-ritual/atelier/Confirmation";
import { useBespokeOrder } from "@/components/signature-ritual/BespokeOrderContext";
import { ritualPath } from "@/components/signature-ritual/routes";

function resolveCustomerId(
  orderRefId: string | number | undefined,
): string | null {
  const fromOrder =
    orderRefId !== undefined && orderRefId !== null && String(orderRefId).trim()
      ? String(orderRefId).trim()
      : "";
  if (fromOrder) return fromOrder;
  const pid = readKioskFlowState().profile?.id;
  return pid !== undefined && pid !== null && String(pid).trim()
    ? String(pid).trim()
    : null;
}

export function ConfirmStep() {
  const router = useRouter();
  const { order, update, reset } = useBespokeOrder();
  const [cardIds, setCardIds] = useState<string[]>([]);
  const [bootLoading, setBootLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const addressId = order.deliveryAddress?.id?.trim() ?? "";

  useEffect(() => {
    if (order.deliveryAddress?.id) return;
    const customerId = resolveCustomerId(order.referenceCustomerId);
    if (!customerId) return;

    let cancelled = false;
    void (async () => {
      try {
        const rows = await fetchAllDeliveryAddressesMerged(customerId, 20);
        const selected = rows.find(r => r.isSelected) ?? rows[0];
        if (!cancelled && selected) {
          update({ deliveryAddress: deliveryAddressToOrderSnapshot(selected) });
        }
      } catch {
        /* optional hydrate */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [order.deliveryAddress?.id, order.referenceCustomerId, update]);

  const loadCartLineIds = useCallback(async () => {
    const customerId = resolveCustomerId(order.referenceCustomerId);
    if (!customerId) {
      setCardIds([]);
      setCheckoutError(
        "Kein Kundenprofil in diesem Browser — bitte Kiosk-Flow erneut starten.",
      );
      setBootLoading(false);
      return;
    }

    setBootLoading(true);
    setCheckoutError(null);
    try {
      const cards = await fetchAllPremiumCardsMerged(customerId, 50);
      const ids = cards
        .map(c => (c.id ? String(c.id).trim() : ""))
        .filter(Boolean);
      setCardIds(ids);
      if (ids.length === 0) {
        setCheckoutError("Warenkorb ist leer — bitte Artikel hinzufügen.");
      }
    } catch (e) {
      setCardIds([]);
      setCheckoutError(
        e instanceof Error
          ? e.message
          : "Warenkorb konnte nicht geladen werden.",
      );
    } finally {
      setBootLoading(false);
    }
  }, [order.referenceCustomerId]);

  useEffect(() => {
    void loadCartLineIds();
  }, [loadCartLineIds]);

  const canPay = useMemo(
    () => !bootLoading && cardIds.length > 0 && Boolean(addressId),
    [bootLoading, cardIds.length, addressId],
  );

  const goToStripeCheckout = useCallback(async () => {
    if (!canPay) {
      if (!addressId) {
        toast.error("Lieferadresse fehlt — bitte zurück zur Kasse.", {
          id: "premium-checkout-no-addr",
          duration: 4000,
        });
        router.push(ritualPath("checkout"));
        return;
      }
      if (cardIds.length === 0) {
        toast.error("Warenkorb ist leer.", { id: "premium-checkout-empty" });
      }
      return;
    }

    setPayLoading(true);
    setCheckoutError(null);
    try {
      const url = await createPremiumCheckoutSession({
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
      toast.error(msg, { id: "premium-checkout-err", duration: 4500 });
    } finally {
      setPayLoading(false);
    }
  }, [canPay, cardIds, addressId, router]);

  return (
    <Confirmation
      order={order}
      checkoutLoading={bootLoading}
      checkoutRedirecting={payLoading}
      checkoutError={checkoutError}
      checkoutReady={canPay}
      onBack={() => router.push(ritualPath("checkout"))}
      onPay={() => void goToStripeCheckout()}
      onRetry={() => void loadCartLineIds()}
      onReset={() => {
        reset();
        router.push(ritualPath("idle"));
      }}
    />
  );
}
