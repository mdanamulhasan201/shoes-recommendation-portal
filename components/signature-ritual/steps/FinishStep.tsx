"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FinishSelection } from "@/components/signature-ritual/atelier/FinishSelection";
import { useBespokeOrder } from "@/components/signature-ritual/BespokeOrderContext";
import { usePremiumShoe } from "@/components/signature-ritual/PremiumShoeContext";
import {
  ritualPath,
  ritualPathWithPremiumId,
} from "@/components/signature-ritual/routes";
import { orderPatchForLeatherType } from "@/app/lib/premiumShoeMappers";
import { isOxfordModelType } from "@/api/premium/premiumShoeApi";

export function FinishStep() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get("id")?.trim() ?? "";

  const { order, update, hasHydrated } = useBespokeOrder();
  const { details, loadState, errorMessage, ensureLoaded } = usePremiumShoe();
  const [bootstrapped, setBootstrapped] = useState(false);

  const premiumShoeId =
    idFromUrl || order.premiumReferenceShoeId?.trim() || "";

  useEffect(() => {
    if (!hasHydrated) return;
    if (idFromUrl && idFromUrl !== order.premiumReferenceShoeId) {
      update({ premiumReferenceShoeId: idFromUrl });
    }
  }, [hasHydrated, idFromUrl, order.premiumReferenceShoeId, update]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!premiumShoeId) {
      router.replace(ritualPath("model"));
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        await ensureLoaded(premiumShoeId);
        if (!cancelled) setBootstrapped(true);
      } catch {
        if (!cancelled) setBootstrapped(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasHydrated, premiumShoeId, ensureLoaded, router]);

  useEffect(() => {
    if (!bootstrapped || !details || !premiumShoeId) return;
    const types = details.leather_type ?? [];
    if (types.length <= 1) {
      router.replace(ritualPathWithPremiumId("customize", premiumShoeId));
    }
  }, [bootstrapped, details, premiumShoeId, router]);

  if (!hasHydrated || !premiumShoeId) {
    return null;
  }

  if (loadState === "loading" || !bootstrapped) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <p
          className="text-xs tracking-[0.25em] uppercase"
          style={{ color: "oklch(0.82 0.04 72)" }}
        >
          Lädt…
        </p>
      </div>
    );
  }

  if (loadState === "error" || !details) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        <p className="text-sm" style={{ color: "oklch(0.9 0.03 82 / 0.92)" }}>
          {errorMessage ?? "Daten nicht gefunden."}
        </p>
        <button
          type="button"
          onClick={() => router.push(ritualPath("model"))}
          className="mt-8 text-sm tracking-wide transition-opacity hover:opacity-90"
          style={{ color: "oklch(0.93 0.11 78)" }}
        >
          Zur Modellauswahl
        </button>
      </div>
    );
  }

  const types = details.leather_type ?? [];
  if (types.length <= 1) return null;

  const modelLabel = details.model_name?.trim() ?? "";

  return (
    <FinishSelection
      leatherTypes={types}
      modelLabel={modelLabel}
      onBack={() => {
        const apiType = order.premiumModelType?.trim() ?? "";
        const oxfordFlow =
          isOxfordModelType(apiType) || (!apiType && order.model === "oxford");
        router.push(
          oxfordFlow ? ritualPath("oxford-finish") : ritualPath("last"),
        );
      }}
      onConfirm={(lt) => {
        update(orderPatchForLeatherType(lt));
        router.push(ritualPathWithPremiumId("customize", premiumShoeId));
      }}
    />
  );
}
