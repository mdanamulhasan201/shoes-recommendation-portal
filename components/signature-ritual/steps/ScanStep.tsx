"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchLatestScreenerFile } from "@/api/scannerApi";
import { ScanningRitual } from "@/components/signature-ritual/atelier/ScanningRitual";
import { ritualPath } from "@/components/signature-ritual/routes";
import { useBespokeOrder } from "@/components/signature-ritual/BespokeOrderContext";

export function ScanStep() {
  const router = useRouter();
  const { order, update } = useBespokeOrder();

  const handleComplete = useCallback(async () => {
    const customerId = order.referenceCustomerId;
    if (customerId !== undefined && customerId !== null) {
      try {
        const latest = await fetchLatestScreenerFile(customerId);
        update({
          ...(latest ? { scannerFile: latest } : {}),
          skippedScanToModel: false,
        });
      } catch {
        /* proceed without file meta */
      }
    }
    router.push(ritualPath("model"));
  }, [order.referenceCustomerId, router, update]);

  return (
    <ScanningRitual
      onComplete={handleComplete}
      onBack={() => router.push(ritualPath("welcome"))}
    />
  );
}
