"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  extractPremiumShoeIdFromRow,
  fetchPremiumShoeDetails,
  type LeatherTypeRow,
  type PremiumFirstViewRow,
  type PremiumShoeDetails,
} from "@/api/premium/premiumShoeApi";

type LoadState = "idle" | "loading" | "ready" | "error";

type PremiumShoeContextValue = {
  details: PremiumShoeDetails | null;
  loadState: LoadState;
  errorMessage: string | null;
  firstViewRows: PremiumFirstViewRow[];
  setFirstViewRows: (rows: PremiumFirstViewRow[]) => void;
  shoeIdFromFirstView: (modelType: string) => string | null;
  ensureLoaded: (id: string) => Promise<PremiumShoeDetails>;
  clear: () => void;
  getLeatherType: (id: string | undefined) => LeatherTypeRow | null;
};

const PremiumShoeContext = createContext<PremiumShoeContextValue | null>(null);

export function PremiumShoeProvider({ children }: { children: ReactNode }) {
  const [details, setDetails] = useState<PremiumShoeDetails | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [firstViewRows, setFirstViewRows] = useState<PremiumFirstViewRow[]>([]);
  const inflight = useRef<Promise<PremiumShoeDetails> | null>(null);
  const loadedId = useRef<string | null>(null);
  const detailsRef = useRef<PremiumShoeDetails | null>(null);

  const clear = useCallback(() => {
    setDetails(null);
    detailsRef.current = null;
    setLoadState("idle");
    setErrorMessage(null);
    inflight.current = null;
    loadedId.current = null;
  }, []);

  const shoeIdFromFirstView = useCallback(
    (modelType: string): string | null => {
      const normalized = modelType.trim().toUpperCase();
      const row = firstViewRows.find(
        (r) => String(r.model_type).trim().toUpperCase() === normalized,
      );
      return row ? extractPremiumShoeIdFromRow(row) : null;
    },
    [firstViewRows],
  );

  const ensureLoaded = useCallback(async (id: string): Promise<PremiumShoeDetails> => {
    if (loadedId.current === id && detailsRef.current) {
      return detailsRef.current;
    }
    if (inflight.current) return inflight.current;

    setLoadState("loading");
    setErrorMessage(null);

    const p = fetchPremiumShoeDetails(id)
      .then((data) => {
        loadedId.current = id;
        detailsRef.current = data;
        setDetails(data);
        setLoadState("ready");
        return data;
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Premium shoe konnte nicht geladen werden.";
        setErrorMessage(msg);
        setLoadState("error");
        throw err;
      })
      .finally(() => {
        inflight.current = null;
      });

    inflight.current = p;
    return p;
  }, []);

  const getLeatherType = useCallback(
    (id: string | undefined): LeatherTypeRow | null => {
      const list = detailsRef.current?.leather_type ?? details?.leather_type;
      if (!id || !list?.length) return null;
      return list.find((t) => t.id === id) ?? null;
    },
    [details],
  );

  const value = useMemo(
    () => ({
      details,
      loadState,
      errorMessage,
      firstViewRows,
      setFirstViewRows,
      shoeIdFromFirstView,
      ensureLoaded,
      clear,
      getLeatherType,
    }),
    [
      details,
      loadState,
      errorMessage,
      firstViewRows,
      shoeIdFromFirstView,
      ensureLoaded,
      clear,
      getLeatherType,
    ],
  );

  return (
    <PremiumShoeContext.Provider value={value}>{children}</PremiumShoeContext.Provider>
  );
}

export function usePremiumShoe() {
  const ctx = useContext(PremiumShoeContext);
  if (!ctx) {
    throw new Error("usePremiumShoe must be used within PremiumShoeProvider");
  }
  return ctx;
}
