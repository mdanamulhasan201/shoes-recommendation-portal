"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LastSelection } from "@/components/signature-ritual/atelier/LastSelection";
import { useBespokeOrder } from "@/components/signature-ritual/BespokeOrderContext";
import { usePremiumShoe } from "@/components/signature-ritual/PremiumShoeContext";
import {
  ritualPath,
  ritualPathWithPremiumId,
} from "@/components/signature-ritual/routes";
import { routeAfterPremiumDetails } from "@/app/lib/premiumShoeFlow";
import { orderPatchForLeatherType } from "@/app/lib/premiumShoeMappers";
import { isOxfordModelType } from "@/api/premium/premiumShoeApi";

export function LastStep() {
  const router = useRouter();
  const { order, update, hasHydrated } = useBespokeOrder();
  const { ensureLoaded } = usePremiumShoe();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!order.premiumReferenceShoeId?.trim()) {
      router.replace(ritualPath("model"));
    }
  }, [hasHydrated, order.premiumReferenceShoeId, router]);

  if (!hasHydrated || !order.premiumReferenceShoeId?.trim()) {
    return null;
  }

  const apiType = order.premiumModelType?.trim() ?? "";
  const oxfordFlow =
    isOxfordModelType(apiType) || (!apiType && order.model === "oxford");

  return (
    <LastSelection
      model={order.model}
      onBack={() => router.push(ritualPath("model"))}
      onSelect={(last) => {
        update({ last });
        const shoeId = order.premiumReferenceShoeId!.trim();

        if (oxfordFlow) {
          router.push(ritualPath("oxford-finish"));
          return;
        }

        void (async () => {
          try {
            const details = await ensureLoaded(shoeId);
            const types = details.leather_type ?? [];
            if (types.length === 1) {
              update(orderPatchForLeatherType(types[0]));
            }
            const step = routeAfterPremiumDetails(details, { isOxford: false });
            router.push(ritualPathWithPremiumId(step, shoeId));
          } catch {
            router.push(ritualPathWithPremiumId("finish", shoeId));
          }
        })();
      }}
    />
  );
}
