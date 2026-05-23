"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BespokeOrder } from "@/components/signature-ritual/atelier/types";
import {
  INITIAL_BESPOKE_ORDER,
  normalizeLeatherTonality,
} from "@/components/signature-ritual/atelier/types";

export const BESPOKE_ORDER_STORAGE_KEY = "signature-ritual-order-v1";

function mergeStoredOrder(raw: Partial<BespokeOrder>): BespokeOrder {
  const color =
    raw.color !== undefined && raw.color !== null
      ? normalizeLeatherTonality(raw.color)
      : INITIAL_BESPOKE_ORDER.color;
  return {
    ...INITIAL_BESPOKE_ORDER,
    ...raw,
    color,
    customer: { ...INITIAL_BESPOKE_ORDER.customer, ...raw.customer },
  };
}

type BespokeOrderContextValue = {
  order: BespokeOrder;
  /** `true` after client session restore attempt (useLayoutEffect). */
  hasHydrated: boolean;
  update: (patch: Partial<BespokeOrder>) => void;
  reset: () => void;
};

const BespokeOrderContext = createContext<BespokeOrderContextValue | null>(null);

export function BespokeOrderProvider({ children }: { children: ReactNode }) {
  const [order, setOrder] = useState<BespokeOrder>(INITIAL_BESPOKE_ORDER);
  const [hasHydrated, setHasHydrated] = useState(false);

  /* Before paint on client — avoids wrong/empty UI until a reload after hydration */
  useLayoutEffect(() => {
    try {
      const raw = sessionStorage.getItem(BESPOKE_ORDER_STORAGE_KEY);
      if (raw) {
        setOrder(mergeStoredOrder(JSON.parse(raw) as Partial<BespokeOrder>));
      }
    } catch {
      /* ignore */
    }
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(BESPOKE_ORDER_STORAGE_KEY, JSON.stringify(order));
    } catch {
      /* ignore */
    }
  }, [order]);

  const update = useCallback((patch: Partial<BespokeOrder>) => {
    setOrder((o) => {
      const next = { ...o, ...patch };
      if (patch.customer) {
        next.customer = { ...o.customer, ...patch.customer };
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setOrder(INITIAL_BESPOKE_ORDER);
    try {
      sessionStorage.removeItem(BESPOKE_ORDER_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      order,
      hasHydrated,
      update,
      reset,
    }),
    [order, hasHydrated, update, reset],
  );

  return <BespokeOrderContext.Provider value={value}>{children}</BespokeOrderContext.Provider>;
}

export function useBespokeOrder() {
  const ctx = useContext(BespokeOrderContext);
  if (!ctx) throw new Error("useBespokeOrder must be used within BespokeOrderProvider");
  return ctx;
}
