"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  readKioskFlowState,
  setKioskCheckoutDeliveryAddress,
} from "@/app/kiosk/flow-state";
import { KioskTopBar } from "@/components/kiosk/KioskTopBar";
import { KIOSK_SHOE_DETAIL_ACCENT } from "@/components/recommendations/shoe-detail/constants";
import {
  AddressFormPanel,
  DeleteAddressDialog,
} from "@/components/signature-ritual/atelier/Checkout";
import {
  useDeliveryAddressCheckout,
  type DeliveryAddressOrderSnapshot,
} from "@/components/checkout/useDeliveryAddressCheckout";

function resolveCustomerId(): string | null {
  const pid = readKioskFlowState().profile?.id;
  const s =
    pid !== undefined && pid !== null && String(pid).trim() !== ""
      ? String(pid).trim()
      : "";
  return s || null;
}

export function KioskDeliveryCheckoutPage() {
  const router = useRouter();
  const [entered, setEntered] = useState(false);
  const customerId = useMemo(() => resolveCustomerId(), []);

  const { profile } = readKioskFlowState();
  const recipientName = useMemo(() => {
    const fn = profile?.firstName?.trim() ?? "";
    const ln = profile?.lastName?.trim() ?? "";
    return [fn, ln].filter(Boolean).join(" ") || "—";
  }, [profile?.firstName, profile?.lastName]);
  const recipientEmail = profile?.email?.trim() ?? "";

  const checkout = useDeliveryAddressCheckout(customerId);

  useEffect(() => {
    queueMicrotask(() => setEntered(true));
  }, []);

  const onComplete = (address: DeliveryAddressOrderSnapshot) => {
    setKioskCheckoutDeliveryAddress(address);
    router.push("/kiosk/confirm");
  };

  return (
    <section
      className="relative flex h-dvh max-h-dvh min-h-0 w-full flex-col overflow-hidden bg-[#050505] text-white"
      aria-label="Lieferadresse"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--primary)/0.06)_0%,transparent_50%)]" />

      <div
        className="relative z-10 flex min-h-0 w-full flex-1 flex-col"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
      >
        <div className="w-full shrink-0 border-b border-white/[0.06] bg-[#050505]/90 backdrop-blur-md">
          <KioskTopBar
            onBack={() => router.push("/kiosk/warenkorb")}
            cartCount={0}
            warenkorbDecorativeOnly
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
          <div
            className="mx-auto flex w-full max-w-[720px] flex-col px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6"
            style={{
              opacity: entered ? 1 : 0,
              transform: entered ? "translateY(0)" : "translateY(12px)",
              transition: "opacity 380ms ease-out, transform 380ms ease-out",
            }}
          >
            <div className="mt-5 text-center sm:mt-6">
              <p
                className="kiosk-mono text-[10px] font-bold tracking-[0.28em]"
                style={{ color: KIOSK_SHOE_DETAIL_ACCENT }}
              >
                LIEFERUNG
              </p>
              <h1 className="kiosk-display mt-2 text-2xl font-extrabold sm:text-3xl">
                Wohin liefern wir?
              </h1>
              <p className="mx-auto mt-2 max-w-md text-xs text-white/45">
                Adresse wählen oder neu anlegen — dieselben Daten wie im
                Premium-Atelier.
              </p>
            </div>

            <div
              className="mt-8 rounded-2xl border border-white/[0.08] bg-[#141820]/90 p-4 sm:p-5"
              style={{
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.35)",
              }}
            >
              <p className="kiosk-mono text-[10px] tracking-[0.2em] text-white/45">
                EMPFÄNGER
              </p>
              <p className="mt-2 text-base font-semibold text-white">
                {recipientName}
              </p>
              {recipientEmail ? (
                <p className="mt-1 text-sm text-white/50">{recipientEmail}</p>
              ) : null}
            </div>

            {!customerId ? (
              <p
                className="mt-6 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-200/90"
                role="alert"
              >
                Kein Kundenprofil — bitte Kiosk vom Start durchlaufen.
              </p>
            ) : null}

            {checkout.loadError ? (
              <p className="mt-4 text-center text-xs text-amber-300/90" role="alert">
                {checkout.loadError}
              </p>
            ) : null}

            {checkout.loading ? (
              <p className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-10 text-center text-sm text-white/55">
                Adressen werden geladen…
              </p>
            ) : (
              <div className="mt-8 space-y-3">
                <p className="kiosk-mono text-[10px] tracking-[0.2em] text-white/45">
                  GESPEICHERTE ADRESSEN
                </p>
                <div className="flex flex-col gap-3">
                  {checkout.addresses.map(row => {
                    const selected =
                      checkout.selectedId === row.id && !checkout.showNewForm;
                    const busyPrimary = checkout.settingPrimaryId === row.id;
                    return (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => checkout.selectAddress(row)}
                        className={`relative rounded-2xl border p-4 text-left transition-all sm:p-5 ${
                          selected
                            ? "border-[hsl(var(--primary)/0.55)] bg-[hsl(var(--primary)/0.08)]"
                            : "border-white/[0.08] bg-[#141820]/90 hover:border-white/16"
                        }`}
                        style={
                          selected
                            ? {
                                boxShadow:
                                  "inset 0 0 0 1px hsl(var(--primary) / 0.2)",
                              }
                            : {
                                boxShadow:
                                  "inset 0 1px 0 rgba(255,255,255,0.04)",
                              }
                        }
                      >
                        {row.isSelected ? (
                          <span
                            className="absolute left-4 top-4 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white"
                            style={{ background: KIOSK_SHOE_DETAIL_ACCENT }}
                          >
                            Standard
                          </span>
                        ) : null}
                        <span className="absolute right-4 top-4 flex h-4 w-4 items-center justify-center rounded-full border border-white/25">
                          {selected ? (
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: KIOSK_SHOE_DETAIL_ACCENT }}
                            />
                          ) : null}
                        </span>
                        <p
                          className={`pr-8 text-[10px] font-bold uppercase tracking-[0.16em] text-white/50 ${
                            row.isSelected ? "mt-5" : ""
                          }`}
                        >
                          {row.description || "Adresse"}
                        </p>
                        <p className="mt-2 text-sm text-white/90">{row.phone}</p>
                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/55">
                          {row.address}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={e => {
                              e.stopPropagation();
                              checkout.startEditAddress(row);
                            }}
                            onKeyDown={e => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                checkout.startEditAddress(row);
                              }
                            }}
                            className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 hover:text-white"
                          >
                            Bearbeiten
                          </span>
                          {!row.isSelected ? (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={e => {
                                e.stopPropagation();
                                void checkout.setStandardAddressNow(row.id);
                              }}
                              onKeyDown={e => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  void checkout.setStandardAddressNow(row.id);
                                }
                              }}
                              className={`cursor-pointer text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40 hover:text-white/70 ${
                                busyPrimary ? "opacity-40" : ""
                              }`}
                            >
                              {busyPrimary ? "…" : "Als Standard"}
                            </span>
                          ) : null}
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={e => {
                              e.stopPropagation();
                              checkout.setDeleteTargetId(row.id);
                            }}
                            onKeyDown={e => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                checkout.setDeleteTargetId(row.id);
                              }
                            }}
                            className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.12em] text-red-400/75 hover:text-red-300"
                          >
                            Löschen
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={checkout.startNewAddress}
                    className={`flex min-h-[120px] flex-col items-center justify-center rounded-2xl border border-dashed p-4 transition-colors ${
                      checkout.showNewForm
                        ? "border-[hsl(var(--primary)/0.45)] bg-[hsl(var(--primary)/0.06)]"
                        : "border-white/16 bg-white/[0.02] hover:border-white/28"
                    }`}
                  >
                    <span className="text-2xl text-white/50">+</span>
                    <span className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
                      Neue Adresse
                    </span>
                  </button>
                </div>
              </div>
            )}

            {checkout.formActive ? (
              <AddressFormPanel
                variant="kiosk"
                editingId={checkout.editingId}
                form={checkout.form}
                composedAddress={checkout.composedAddress}
                canSaveForm={checkout.canSaveForm}
                savingForm={checkout.savingForm}
                patchForm={checkout.patchForm}
                onSave={() => void checkout.handleSaveAddress()}
                onCancel={checkout.cancelForm}
              />
            ) : null}

            <button
              type="button"
              disabled={
                !checkout.canContinue ||
                checkout.savingContinue ||
                checkout.savingForm ||
                !customerId
              }
              onClick={() => void checkout.handleContinue(onComplete)}
              className="mt-10 w-full cursor-pointer rounded-full py-4 text-center text-sm font-bold tracking-[0.14em] text-white transition-all disabled:cursor-not-allowed disabled:opacity-35"
              style={{
                background: KIOSK_SHOE_DETAIL_ACCENT,
                boxShadow: "0 12px 32px rgba(96,164,133,0.28)",
              }}
            >
              {checkout.savingContinue
                ? "Wird geladen…"
                : "WEITER ZUR BESTÄTIGUNG"}
            </button>
          </div>
        </div>
      </div>

      {checkout.deleteTargetId ? (
        <DeleteAddressDialog
          variant="kiosk"
          deleting={checkout.deleting}
          onCancel={() => checkout.setDeleteTargetId(null)}
          onConfirm={() => void checkout.confirmDeleteAddress()}
        />
      ) : null}
    </section>
  );
}
