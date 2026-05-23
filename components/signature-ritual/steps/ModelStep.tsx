"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ModelSelection } from "@/components/signature-ritual/atelier/ModelSelection";
import type { ShoeModel } from "@/components/signature-ritual/atelier/types";
import { useBespokeOrder } from "@/components/signature-ritual/BespokeOrderContext";
import { usePremiumShoe } from "@/components/signature-ritual/PremiumShoeContext";
import { ritualPath } from "@/components/signature-ritual/routes";
import {
  fetchPremiumShoeDetailsByModelType,
  shouldUseSilhouetteNoticeFlow,
  modelTypeToShoeModel,
  resolvePremiumShoeIdForModelType,
} from "@/api/premium/premiumShoeApi";

export function ModelStep() {
  const router = useRouter();
  const { order, update } = useBespokeOrder();
  const { shoeIdFromFirstView } = usePremiumShoe();
  const [busy, setBusy] = useState(false);

  const modelBackPath = order.skippedScanToModel
    ? ritualPath("welcome")
    : ritualPath("scan");

  return (
    <ModelSelection
      configureBusy={busy}
      onBack={() => router.push(modelBackPath)}
      onSelect={(
        model: ShoeModel,
        premiumShoeId: string | undefined,
        apiModelType: string,
        carouselIndex: number,
      ) => {
        if (busy) return;
        setBusy(true);

        const mappedModel = modelTypeToShoeModel(apiModelType) ?? model;

        void (async () => {
          try {
            let shoeId =
              premiumShoeId?.trim() ||
              shoeIdFromFirstView(apiModelType) ||
              (await resolvePremiumShoeIdForModelType(apiModelType)) ||
              undefined;

            if (!shoeId) {
              try {
                const byType =
                  await fetchPremiumShoeDetailsByModelType(apiModelType);
                shoeId = byType.id?.trim() || undefined;
              } catch {
                /* no id */
              }
            }

            if (!shoeId) {
              setBusy(false);
              return;
            }

            const silhouetteFlow = shouldUseSilhouetteNoticeFlow(
              carouselIndex,
              apiModelType,
            );

            update({
              model: mappedModel,
              premiumModelType: apiModelType,
              premiumReferenceShoeId: shoeId,
              premiumSilhouetteFlow: silhouetteFlow,
              selectedLeatherTypeId: undefined,
              premiumColorId: undefined,
              premiumPatinaVariantId: undefined,
              patinaTechnique: undefined,
              patinaColor: undefined,
            });

            router.push(
              silhouetteFlow ? ritualPath("silhouette") : ritualPath("last"),
            );
          } finally {
            setBusy(false);
          }
        })();
      }}
    />
  );
}
