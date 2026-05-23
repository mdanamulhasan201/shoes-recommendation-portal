"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { KIOSK_FLOW_KEY, readKioskFlowState } from "@/app/kiosk/flow-state";
import {
  fetchAllPremiumCardsMerged,
  premiumCardArticleCount,
  type PremiumWarenkorbChangeDetail,
} from "@/api/premium/premiumShoeCardApi";

function resolveCustomerId(): string | null {
  const pid = readKioskFlowState().profile?.id;
  const s =
    pid !== undefined && pid !== null && String(pid).trim() !== ""
      ? String(pid).trim()
      : "";
  return s || null;
}

function applyOptimisticDelta(
  prev: number,
  detail: PremiumWarenkorbChangeDetail | undefined,
): number {
  const d = detail?.delta;
  if (d === undefined || d === null || !Number.isFinite(d)) return prev;
  return Math.max(0, Math.min(999, prev + Math.floor(d)));
}

/** Live premium cart article count (nav badge + Fortfahren gate). */
export function usePremiumWarenkorbArticleCount(): number {
  const [count, setCount] = useState(0);
  const refreshGen = useRef(0);

  const refreshCount = useCallback(async () => {
    const cid = resolveCustomerId();
    if (!cid) {
      setCount(0);
      return;
    }
    const gen = ++refreshGen.current;
    try {
      const rows = await fetchAllPremiumCardsMerged(cid, 50);
      if (gen !== refreshGen.current) return;
      setCount(premiumCardArticleCount(rows));
    } catch {
      if (gen !== refreshGen.current) return;
    }
  }, []);

  const onCartChanged = useCallback(
    (e: Event) => {
      const detail = (e as CustomEvent<PremiumWarenkorbChangeDetail>).detail;
      setCount((prev) => applyOptimisticDelta(prev, detail));
      void refreshCount();
      window.setTimeout(() => void refreshCount(), 400);
    },
    [refreshCount],
  );

  useEffect(() => {
    void refreshCount();
  }, [refreshCount]);

  useEffect(() => {
    window.addEventListener("premium-warenkorb-changed", onCartChanged);
    return () =>
      window.removeEventListener("premium-warenkorb-changed", onCartChanged);
  }, [onCartChanged]);

  useEffect(() => {
    const onFlow = () => void refreshCount();
    window.addEventListener("kiosk-flow-changed", onFlow);
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === KIOSK_FLOW_KEY) void refreshCount();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("kiosk-flow-changed", onFlow);
      window.removeEventListener("storage", onStorage);
    };
  }, [refreshCount]);

  return count;
}
