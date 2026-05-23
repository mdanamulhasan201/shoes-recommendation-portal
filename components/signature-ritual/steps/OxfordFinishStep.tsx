"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OxfordFinishNotice } from "@/components/signature-ritual/atelier/OxfordFinishNotice";
import { useBespokeOrder } from "@/components/signature-ritual/BespokeOrderContext";
import { ritualPath, ritualPathWithPremiumId } from "@/components/signature-ritual/routes";
import { isOxfordModelType } from "@/api/premium/premiumShoeApi";

export function OxfordFinishStep() {
  const router = useRouter();
  const { order, hasHydrated } = useBespokeOrder();

  useEffect(() => {
    if (!hasHydrated) return;
    const apiType = order.premiumModelType?.trim() ?? "";
    const oxfordFlow =
      isOxfordModelType(apiType) || (!apiType && order.model === "oxford");
    if (!oxfordFlow) {
      router.replace(ritualPath("model"));
    }
  }, [hasHydrated, order.model, order.premiumModelType, router]);

  const apiType = order.premiumModelType?.trim() ?? "";
  const oxfordFlow =
    isOxfordModelType(apiType) || (!apiType && order.model === "oxford");

  if (!hasHydrated || !oxfordFlow) {
    return null;
  }

  return (
    <OxfordFinishNotice
      onBack={() => router.push(ritualPath("last"))}
      onContinue={() => {
        const id = order.premiumReferenceShoeId?.trim();
        router.push(
          id ? ritualPathWithPremiumId("customize", id) : ritualPath("customize"),
        );
      }}
    />
  );
}
