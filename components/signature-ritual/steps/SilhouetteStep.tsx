"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SilhouetteNotice } from "@/components/signature-ritual/atelier/SilhouetteNotice";
import { useBespokeOrder } from "@/components/signature-ritual/BespokeOrderContext";
import { usePremiumShoe } from "@/components/signature-ritual/PremiumShoeContext";
import { orderPatchForLeatherType } from "@/app/lib/premiumShoeMappers";
import {
  ritualPath,
  ritualPathWithPremiumId,
} from "@/components/signature-ritual/routes";

export function SilhouetteStep() {
  const router = useRouter();
  const { order, update, hasHydrated } = useBespokeOrder();
  const { ensureLoaded } = usePremiumShoe();

  const silhouetteFlow = Boolean(order.premiumSilhouetteFlow);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!order.premiumReferenceShoeId?.trim()) {
      router.replace(ritualPath("model"));
      return;
    }
    if (!silhouetteFlow) {
      router.replace(ritualPath("last"));
    }
  }, [
    hasHydrated,
    order.premiumReferenceShoeId,
    silhouetteFlow,
    router,
  ]);

  if (!hasHydrated || !silhouetteFlow || !order.premiumReferenceShoeId?.trim()) {
    return null;
  }

  return (
    <SilhouetteNotice
      onBack={() => router.push(ritualPath("model"))}
      onContinue={() => {
        const shoeId = order.premiumReferenceShoeId!.trim();
        void (async () => {
          try {
            const details = await ensureLoaded(shoeId);
            const types = details.leather_type ?? [];
            if (types.length === 1) {
              update(orderPatchForLeatherType(types[0]));
            }
          } catch {
            /* customize bootstrap will retry */
          }
          router.push(ritualPathWithPremiumId("customize", shoeId));
        })();
      }}
    />
  );
}
