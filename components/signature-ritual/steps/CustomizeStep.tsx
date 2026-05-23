"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Customization } from "@/components/signature-ritual/atelier/Customization";
import { useBespokeOrder } from "@/components/signature-ritual/BespokeOrderContext";
import { usePremiumShoe } from "@/components/signature-ritual/PremiumShoeContext";
import { ritualPath } from "@/components/signature-ritual/routes";
import { orderPatchForLeatherType } from "@/app/lib/premiumShoeMappers";
import { resolveShoeImageSrc } from "@/api/shoeImageSrc";
import {
  fetchPremiumShoeDetailsByModelType,
  resolvePremiumShoeIdForModelType,
} from "@/api/premium/premiumShoeApi";
import type { LeatherTypeRow } from "@/api/premium/premiumShoeApi";

type BootstrapPhase = "idle" | "loading" | "ready" | "error";

export function CustomizeStep() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get("id")?.trim() ?? "";

  const { order, update, hasHydrated } = useBespokeOrder();
  const {
    details,
    ensureLoaded,
    getLeatherType,
    loadState,
    errorMessage,
    shoeIdFromFirstView,
  } = usePremiumShoe();

  const [bootstrap, setBootstrap] = useState<BootstrapPhase>("idle");
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const wantsPremium =
    Boolean(idFromUrl) ||
    Boolean(order.premiumReferenceShoeId?.trim()) ||
    Boolean(order.premiumModelType?.trim());

  const premiumShoeId =
    idFromUrl || order.premiumReferenceShoeId?.trim() || "";

  useEffect(() => {
    if (!hasHydrated) return;
    if (idFromUrl && idFromUrl !== order.premiumReferenceShoeId) {
      update({ premiumReferenceShoeId: idFromUrl });
    }
  }, [hasHydrated, idFromUrl, order.premiumReferenceShoeId, update]);

  useEffect(() => {
    if (!hasHydrated || !wantsPremium) return;

    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setBootstrapError(null);
      try {
        let shoeId = premiumShoeId || undefined;
        const modelType = order.premiumModelType?.trim();

        if (!shoeId && modelType) {
          shoeId =
            shoeIdFromFirstView(modelType) ??
            (await resolvePremiumShoeIdForModelType(modelType)) ??
            undefined;
          if (shoeId && !cancelled) {
            update({ premiumReferenceShoeId: shoeId });
          }
        }

        if (!shoeId && modelType) {
          try {
            const byType = await fetchPremiumShoeDetailsByModelType(modelType);
            if (!cancelled) {
              update({ premiumReferenceShoeId: byType.id });
              shoeId = byType.id;
            }
          } catch {
            /* try id path below */
          }
        }

        if (!shoeId) {
          if (!cancelled) {
            setBootstrapError("Premium-Schuh-ID fehlt.");
            setBootstrap("error");
          }
          return;
        }

        const data = await ensureLoaded(shoeId);
        if (cancelled) return;

        const types = data.leather_type ?? [];
        if (types.length > 1 && !order.selectedLeatherTypeId) {
          router.replace(ritualPath("finish"));
          return;
        }
        if (types.length === 1 && !order.selectedLeatherTypeId) {
          update(orderPatchForLeatherType(types[0]));
        }

        setBootstrap("ready");
      } catch (err) {
        if (!cancelled) {
          setBootstrapError(
            err instanceof Error ? err.message : "Daten konnten nicht geladen werden.",
          );
          setBootstrap("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    hasHydrated,
    wantsPremium,
    premiumShoeId,
    order.premiumModelType,
    order.selectedLeatherTypeId,
    ensureLoaded,
    update,
    router,
    shoeIdFromFirstView,
  ]);

  const resolvedLeatherType: LeatherTypeRow | null = useMemo(() => {
    const types = details?.leather_type ?? [];
    if (!types.length) return null;
    if (order.selectedLeatherTypeId) {
      return getLeatherType(order.selectedLeatherTypeId) ?? types[0] ?? null;
    }
    if (types.length === 1) return types[0];
    return null;
  }, [details, order.selectedLeatherTypeId, getLeatherType]);

  const premiumModelImage = details?.model_image
    ? resolveShoeImageSrc(details.model_image)
    : null;
  const premiumModelName = details?.model_name?.trim();

  const premiumFromApi =
    wantsPremium && bootstrap === "ready" && loadState === "ready" && Boolean(details);

  const premiumBootBlocking =
    wantsPremium && bootstrap !== "ready" && bootstrap !== "error";

  const customizeBack = () => {
    if (order.model === "oxford") {
      router.push(ritualPath("oxford-finish"));
      return;
    }
    const types = details?.leather_type ?? [];
    if (types.length > 1) {
      router.push(ritualPath("finish"));
      return;
    }
    router.push(ritualPath("model"));
  };

  if (!hasHydrated) {
    return null;
  }

  if (premiumBootBlocking) {
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

  if (wantsPremium && bootstrap === "error") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        <p className="text-sm" style={{ color: "oklch(0.9 0.03 82 / 0.92)" }}>
          {bootstrapError ?? errorMessage ?? "Daten nicht gefunden."}
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

  const resolvedPremiumShoeId =
    details?.id?.trim() || premiumShoeId || undefined;

  return (
    <Customization
      order={order}
      onUpdate={update}
      onContinue={() => router.push(ritualPath("character"))}
      onBack={customizeBack}
      premiumLeatherType={resolvedLeatherType}
      premiumModelImage={premiumModelImage}
      premiumModelName={premiumModelName}
      premiumFromApi={premiumFromApi}
      premiumReferenceShoeId={resolvedPremiumShoeId}
    />
  );
}
