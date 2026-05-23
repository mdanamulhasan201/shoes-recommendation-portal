"use client";

import { motion } from "framer-motion";
import { BackButton } from "@/components/signature-ritual/atelier/BackButton";
import {
  LABEL_OPTIONS,
  useDeliveryAddressCheckout,
  type DeliveryAddressOrderSnapshot,
} from "@/components/checkout/useDeliveryAddressCheckout";

const CHECKOUT = {
  eyebrow: "oklch(0.9 0.095 75)",
  title: "oklch(0.99 0.022 85)",
  titleShadow:
    "0 0 32px oklch(0.9 0.11 78 / 0.3), 0 2px 12px rgba(0,0,0,0.18)",
  subtitle: "oklch(0.84 0.035 75)",
  label: "oklch(0.88 0.095 75)",
  body: "oklch(0.96 0.02 85)",
  bodyMuted: "oklch(0.82 0.04 75)",
  hint: "oklch(0.78 0.03 72)",
  panelBorder: "oklch(0.92 0.02 80 / 0.22)",
  panelBg: "oklch(0.06 0.004 60 / 0.42)",
  ambient: "oklch(0.9 0.11 78 / 0.1)",
} as const;

export function Checkout({
  customerId,
  recipientName,
  recipientEmail,
  onComplete,
  onBack,
}: {
  customerId: string | null;
  recipientName: string;
  recipientEmail: string;
  onComplete: (address: DeliveryAddressOrderSnapshot) => void;
  onBack?: () => void;
}) {
  const checkout = useDeliveryAddressCheckout(customerId);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="absolute inset-0 overflow-y-auto overscroll-y-contain"
    >
      {onBack ? <BackButton onClick={onBack} /> : null}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 20%, ${CHECKOUT.ambient} 0%, transparent 70%)`,
        }}
      />

      <motion.div className="relative z-10 mx-auto w-full max-w-2xl px-5 pb-16 pt-20 md:px-8 md:pt-24">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center md:mb-10"
        >
          <p
            className="tracking-whisper text-[0.65rem]"
            style={{ color: CHECKOUT.eyebrow }}
          >
            — Lieferung —
          </p>
          <h1
            className="font-display mt-2 text-2xl italic md:text-3xl"
            style={{ color: CHECKOUT.title, textShadow: CHECKOUT.titleShadow }}
          >
            Wohin sollen wir liefern?
          </h1>
          <p
            className="mx-auto mt-2 max-w-md text-xs tracking-wide"
            style={{ color: CHECKOUT.subtitle }}
          >
            Wählen Sie eine Adresse — Standard markieren Sie auf der Karte mit
            „Als Standard“.
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-8 rounded-sm border p-4 md:p-5"
          style={{
            borderColor: CHECKOUT.panelBorder,
            backgroundColor: CHECKOUT.panelBg,
          }}
        >
          <p
            className="text-[0.55rem] uppercase tracking-[0.28em]"
            style={{ color: CHECKOUT.label }}
          >
            Empfänger
          </p>
          <p
            className="font-display mt-2 text-lg italic"
            style={{ color: CHECKOUT.body }}
          >
            {recipientName.trim() || "—"}
          </p>
          {recipientEmail ? (
            <p className="mt-1 text-sm" style={{ color: CHECKOUT.bodyMuted }}>
              {recipientEmail}
            </p>
          ) : null}
        </motion.div>

        {!customerId ? (
          <p className="text-center text-sm text-amber-200/85" role="alert">
            Kein Kundenprofil — bitte den Kiosk-Flow vom Start durchlaufen.
          </p>
        ) : null}

        {checkout.loadError ? (
          <p className="mb-4 text-center text-xs text-amber-200/90" role="alert">
            {checkout.loadError}
          </p>
        ) : null}

        {checkout.loading ? (
          <p
            className="py-8 text-center text-xs uppercase tracking-[0.2em]"
            style={{ color: CHECKOUT.hint }}
          >
            Adressen werden geladen…
          </p>
        ) : (
          <motion.div className="space-y-4">
            <p
              className="text-[0.55rem] uppercase tracking-[0.28em]"
              style={{ color: CHECKOUT.label }}
            >
              Gespeicherte Adressen
            </p>
            <motion.div className="grid gap-3 sm:grid-cols-2">
              {checkout.addresses.map(row => {
                const selected =
                  checkout.selectedId === row.id && !checkout.showNewForm;
                const busyPrimary = checkout.settingPrimaryId === row.id;
                return (
                  <motion.button
                    key={row.id}
                    type="button"
                    onClick={() => checkout.selectAddress(row)}
                    className={`relative rounded-sm border p-4 text-left transition-all ${
                      selected
                        ? "border-[oklch(0.93_0.11_78/0.55)] bg-[oklch(0.93_0.11_78/0.08)] shadow-[inset_0_0_0_1px_oklch(0.92_0.11_78/0.3)]"
                        : "border-[oklch(0.92_0.02_80/0.22)] bg-[oklch(0.06_0.004_60/0.38)] hover:border-[oklch(0.9_0.11_78/0.35)]"
                    } ${row.isSelected ? "pt-8" : ""}`}
                  >
                    {row.isSelected ? (
                      <span className="absolute left-3 top-3 rounded-full border border-gold/40 bg-gold/15 px-2 py-0.5 text-[0.5rem] font-medium uppercase tracking-[0.14em] text-gold">
                        Standard
                      </span>
                    ) : null}
                    <span className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full border border-ivory/25">
                      {selected ? (
                        <span className="h-2 w-2 rounded-full bg-gold" />
                      ) : null}
                    </span>
                    <p
                      className={`pr-6 text-[0.58rem] font-medium uppercase tracking-[0.18em] text-[oklch(0.9_0.095_75)] ${
                        row.isSelected ? "mt-1" : ""
                      }`}
                    >
                      {row.description || "Adresse"}
                    </p>
                    <p className="mt-2 text-sm text-[oklch(0.96_0.02_85)]">
                      {row.phone}
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[oklch(0.86_0.035_80)]">
                      {row.address}
                    </p>
                    <motion.div className="mt-3 flex flex-wrap items-center gap-3">
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
                        className="text-[0.58rem] uppercase tracking-[0.16em] text-[oklch(0.93_0.11_78)] hover:opacity-90"
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
                          className={`text-[0.58rem] uppercase tracking-[0.16em] text-[oklch(0.84_0.04_75)] hover:text-[oklch(0.93_0.11_78)] ${
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
                        className="text-[0.58rem] uppercase tracking-[0.16em] text-red-400/65 hover:text-red-300"
                      >
                        Löschen
                      </span>
                    </motion.div>
                  </motion.button>
                );
              })}

              <motion.button
                type="button"
                onClick={checkout.startNewAddress}
                className={`flex min-h-[140px] flex-col items-center justify-center rounded-sm border border-dashed p-4 transition-colors ${
                  checkout.showNewForm
                    ? "border-[oklch(0.93_0.11_78/0.45)] bg-[oklch(0.93_0.11_78/0.06)]"
                    : "border-[oklch(0.88_0.04_75/0.35)] bg-[oklch(0.06_0.004_60/0.28)] hover:border-[oklch(0.9_0.11_78/0.4)]"
                }`}
              >
                <span className="text-2xl text-[oklch(0.93_0.11_78)]">+</span>
                <span className="mt-2 text-[0.58rem] uppercase tracking-[0.2em] text-[oklch(0.86_0.035_80)]">
                  Neue Adresse
                </span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {checkout.formActive ? (
          <AddressFormPanel
            variant="atelier"
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

        <motion.div className="mt-10">
          <button
            type="button"
            disabled={
              !checkout.canContinue ||
              checkout.savingContinue ||
              checkout.savingForm ||
              !customerId
            }
            onClick={() => void checkout.handleContinue(onComplete)}
            className="w-full rounded-sm border border-[oklch(0.93_0.11_78/0.5)] bg-[oklch(0.98_0.02_85)] py-4 font-sans text-[0.62rem] font-medium uppercase tracking-[0.28em] text-[oklch(0.12_0.01_60)] transition-all hover:bg-[oklch(0.93_0.11_78)] hover:text-[oklch(0.99_0.02_85)] disabled:cursor-not-allowed disabled:opacity-35"
          >
            {checkout.savingContinue ? "Wird geladen…" : "Weiter zur Bestätigung"}
          </button>
          <p
            className="mt-4 text-center text-[0.55rem] uppercase tracking-[0.35em]"
            style={{ color: CHECKOUT.hint }}
          >
            Sicher · Verschlüsselt · Diskret
          </p>
        </motion.div>
      </motion.div>

      {checkout.deleteTargetId ? (
        <DeleteAddressDialog
          variant="atelier"
          deleting={checkout.deleting}
          onCancel={() => checkout.setDeleteTargetId(null)}
          onConfirm={() => void checkout.confirmDeleteAddress()}
        />
      ) : null}
    </motion.section>
  );
}

function AddressFormPanel({
  variant,
  editingId,
  form,
  composedAddress,
  canSaveForm,
  savingForm,
  patchForm,
  onSave,
  onCancel,
}: {
  variant: "atelier" | "kiosk";
  editingId: string | null;
  form: ReturnType<typeof useDeliveryAddressCheckout>["form"];
  composedAddress: string;
  canSaveForm: boolean;
  savingForm: boolean;
  patchForm: ReturnType<typeof useDeliveryAddressCheckout>["patchForm"];
  onSave: () => void;
  onCancel: () => void;
}) {
  const isKiosk = variant === "kiosk";
  const wrapClass = isKiosk
    ? "mt-8 rounded-2xl border border-white/10 bg-[#141820]/90 p-5 sm:p-6"
    : "mt-8 rounded-sm border border-[oklch(0.92_0.11_78/0.28)] bg-[oklch(0.06_0.004_60/0.45)] p-5 md:p-6";
  const labelClass = isKiosk
    ? "mb-2 block text-[10px] font-bold uppercase tracking-[0.22em] text-white/45"
    : "mb-2 block text-[0.55rem] uppercase tracking-[0.28em] text-[oklch(0.9_0.095_75)]";
  const inputClass = isKiosk
    ? "w-full rounded-xl border border-white/12 bg-black/40 px-3 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-[hsl(var(--primary)/0.55)]"
    : "w-full rounded-sm border border-[oklch(0.92_0.02_80/0.28)] bg-[oklch(0.05_0.004_60/0.55)] px-3 py-3 font-sans text-sm text-[oklch(0.98_0.02_85)] outline-none transition-colors placeholder:text-[oklch(0.78_0.03_72/0.55)] placeholder:italic focus:border-[oklch(0.93_0.11_78/0.55)]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={wrapClass}
    >
      <p
        className={
          isKiosk
            ? "mb-5 text-[10px] font-bold uppercase tracking-[0.22em]"
            : "mb-5 text-[0.55rem] uppercase tracking-[0.28em] text-[oklch(0.9_0.095_75)]"
        }
        style={isKiosk ? { color: "hsl(var(--primary))" } : undefined}
      >
        {editingId ? "Adresse bearbeiten" : "Neue Lieferadresse"}
      </p>
      <motion.div className="space-y-5">
        <CheckoutField
          labelClass={labelClass}
          inputClass={inputClass}
          label="Telefon"
          value={form.phone}
          onChange={v => patchForm({ phone: v })}
          placeholder="+49 170 1234567"
          type="tel"
          autoComplete="tel"
        />
        <CheckoutField
          labelClass={labelClass}
          inputClass={inputClass}
          label="Straße und Hausnummer"
          value={form.street}
          onChange={v => patchForm({ street: v })}
          placeholder="Musterstraße 12"
          autoComplete="address-line1"
        />
        <CheckoutField
          labelClass={labelClass}
          inputClass={inputClass}
          label="Adresszusatz (optional)"
          value={form.line2}
          onChange={v => patchForm({ line2: v })}
          placeholder="Etage, Tür, Firmenname"
          autoComplete="address-line2"
        />
        <motion.div className="grid gap-5 sm:grid-cols-2">
          <CheckoutField
            labelClass={labelClass}
            inputClass={inputClass}
            label="PLZ"
            value={form.postal}
            onChange={v => patchForm({ postal: v })}
            placeholder="10115"
            autoComplete="postal-code"
          />
          <CheckoutField
            labelClass={labelClass}
            inputClass={inputClass}
            label="Ort"
            value={form.city}
            onChange={v => patchForm({ city: v })}
            placeholder="Berlin"
            autoComplete="address-level2"
          />
        </motion.div>
        <motion.div>
          <span className={labelClass}>Bezeichnung</span>
          <motion.div className="flex flex-wrap gap-2">
            {LABEL_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => patchForm({ description: opt.id })}
                className={
                  isKiosk
                    ? `rounded-full border px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] transition-colors ${
                        form.description === opt.id
                          ? "border-[hsl(var(--primary)/0.55)] bg-[hsl(var(--primary)/0.12)] text-white"
                          : "border-white/15 text-white/55 hover:border-white/28"
                      }`
                    : `rounded-full border px-4 py-2 text-[0.58rem] uppercase tracking-[0.14em] transition-colors ${
                        form.description === opt.id
                          ? "border-gold/60 bg-gold/15 text-gold"
                          : "border-ivory/15 text-ivory/55 hover:border-ivory/30"
                      }`
                }
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        </motion.div>
        <p
          className={
            isKiosk
              ? "text-xs leading-relaxed text-white/40"
              : "text-[0.65rem] leading-relaxed text-[oklch(0.8_0.03_72)]"
          }
        >
          Vorschau:{" "}
          <span
            className={
              isKiosk
                ? "whitespace-pre-line text-white/55"
                : "whitespace-pre-line text-[oklch(0.88_0.035_80)]"
            }
          >
            {composedAddress || "—"}
          </span>
        </p>
        <motion.div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button
            type="button"
            disabled={!canSaveForm || savingForm}
            onClick={onSave}
            className={
              isKiosk
                ? "flex-1 rounded-full py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-white transition-all disabled:cursor-not-allowed disabled:opacity-35"
                : "flex-1 rounded-sm border border-gold/45 bg-gold/15 py-3.5 font-sans text-[0.62rem] font-medium uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-35"
            }
            style={
              isKiosk
                ? {
                    background: "hsl(var(--primary))",
                    boxShadow: "0 8px 24px hsl(var(--primary) / 0.25)",
                  }
                : undefined
            }
          >
            {savingForm ? "Wird gespeichert…" : "Adresse speichern"}
          </button>
          <button
            type="button"
            disabled={savingForm}
            onClick={onCancel}
            className={
              isKiosk
                ? "rounded-full border border-white/18 px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.1em] text-white/70 transition-colors hover:bg-white/5"
                : "rounded-sm border border-ivory/15 px-6 py-3.5 font-sans text-[0.62rem] uppercase tracking-[0.2em] text-ivory/55 transition-colors hover:border-ivory/30 hover:text-ivory"
            }
          >
            Abbrechen
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function DeleteAddressDialog({
  variant,
  deleting,
  onCancel,
  onConfirm,
}: {
  variant: "atelier" | "kiosk";
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isKiosk = variant === "kiosk";
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
      role="presentation"
      onClick={() => {
        if (!deleting) onCancel();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        className={
          isKiosk
            ? "relative z-[101] w-full max-w-[min(100%,360px)] rounded-2xl border border-white/12 bg-[#141820] p-5 shadow-2xl sm:p-6"
            : "relative z-[101] w-full max-w-sm rounded-sm border border-[oklch(0.92_0.02_80/0.22)] bg-[oklch(0.08_0.005_60)] p-6 shadow-2xl"
        }
        onClick={e => e.stopPropagation()}
      >
        <h2
          className={
            isKiosk
              ? "text-base font-semibold text-white sm:text-lg"
              : "font-display text-lg italic text-[oklch(0.99_0.022_85)]"
          }
        >
          Adresse löschen?
        </h2>
        <p
          className={
            isKiosk ? "mt-3 text-sm text-white/65" : "mt-3 text-sm text-[oklch(0.86_0.035_80)]"
          }
        >
          Diese Lieferadresse wird dauerhaft entfernt.
        </p>
        <motion.div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={deleting}
            onClick={onCancel}
            className={
              isKiosk
                ? "min-h-11 flex-1 rounded-full border border-white/18 py-3 text-sm font-semibold text-white/85 hover:bg-white/5 disabled:opacity-45"
                : "flex-1 rounded-full border border-[oklch(0.92_0.02_80/0.28)] py-3 text-xs uppercase tracking-[0.18em] text-[oklch(0.92_0.02_85)] hover:bg-ivory/5 disabled:opacity-45"
            }
          >
            Abbrechen
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className={
              isKiosk
                ? "min-h-11 flex-1 rounded-full border border-red-500/45 bg-red-500/15 py-3 text-sm font-semibold text-red-200 hover:bg-red-500/25 disabled:opacity-45"
                : "flex-1 rounded-full border border-red-500/40 bg-red-500/10 py-3 text-xs uppercase tracking-[0.18em] text-red-200 hover:bg-red-500/20 disabled:opacity-45"
            }
          >
            {deleting ? "…" : "Löschen"}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

function CheckoutField({
  label,
  labelClass,
  inputClass,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}: {
  label: string;
  labelClass: string;
  inputClass: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={inputClass}
      />
    </label>
  );
}

// Re-export for kiosk page
export { AddressFormPanel };
