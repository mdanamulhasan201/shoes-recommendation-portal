"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  fetchLatestScreenerFile,
  fetchScannerFileById,
} from "@/api/scannerApi";
import { readKioskFlowState } from "@/app/kiosk/flow-state";
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
        // Prefer the id Scantool just wrote into kiosk-flow-v1 after the
        // two-step v3 upload; fall back to "latest" if that race is empty.
        const fromShell = readKioskFlowState().scannerFile?.id;
        const byId =
          fromShell !== undefined && fromShell !== null
            ? await fetchScannerFileById(String(fromShell))
            : null;
        const latest = byId ?? (await fetchLatestScreenerFile(customerId));
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
