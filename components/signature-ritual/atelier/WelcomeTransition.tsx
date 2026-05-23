"use client";

import { motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { fetchLatestScreenerFile, formatGermanTimestamp } from "@/api/scannerApi";
import { apiUrl } from "@/api/apiConfig";
import type { ScannerFileData } from "@/app/kiosk/flow-state";
import { WelcomeReuseScanDialog } from "@/components/signature-ritual/atelier/WelcomeReuseScanDialog";
import { imageSrc } from "./imageSrc";
import welcomeHero from "@/assets/welcome-hero.png";
import type { BespokeOrder } from "@/components/signature-ritual/atelier/types";
import {
  BESPOKE_ORDER_STORAGE_KEY,
  useBespokeOrder,
} from "@/components/signature-ritual/BespokeOrderContext";
import { syncKioskProfileForScantoolShell } from "@/components/signature-ritual/scantoolKioskProfileSync";
const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.085,
      delayChildren: 0.45,
    },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function emailLooksValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function WelcomeTransition({
  onContinue,
  onSkipScan,
  onBack,
}: {
  onContinue: () => void;
  /** Reuse prior scan — skip feet scanning and continue the ritual. */
  onSkipScan: () => void;
  onBack?: () => void;
}) {
  const { order, update } = useBespokeOrder();
  const { customer } = order;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [reusePromptFile, setReusePromptFile] = useState<ScannerFileData | null>(null);
  const postSignupSnapshot = useRef<BespokeOrder | null>(null);

  const patchCustomer = (partial: Partial<typeof customer>) => {
    update({
      customer: {
        ...customer,
        ...partial,
      },
    });
  };

  const setFirstName = (firstName: string) => {
    patchCustomer({
      firstName,
      name: `${firstName.trim()} ${customer.lastName.trim()}`.trim(),
    });
  };

  const setLastName = (lastName: string) => {
    patchCustomer({
      lastName,
      name: `${customer.firstName.trim()} ${lastName.trim()}`.trim(),
    });
  };

  const formReady =
    customer.firstName.trim().length > 0 &&
    customer.lastName.trim().length > 0 &&
    emailLooksValid(customer.email) &&
    customer.gender !== null &&
    customer.privacyAccepted;

  const reuseScanDateLabel = useMemo(() => {
    if (!reusePromptFile) return "";
    return formatGermanTimestamp(reusePromptFile.createdAt ?? reusePromptFile.updatedAt);
  }, [reusePromptFile]);

  const persistOrderSnapshot = (snapshot: BespokeOrder) => {
    try {
      sessionStorage.setItem(BESPOKE_ORDER_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      /* ignore */
    }
  };

  const handleReuseUseExisting = () => {
    if (!reusePromptFile || !postSignupSnapshot.current) return;
    const next = {
      ...postSignupSnapshot.current,
      scannerFile: reusePromptFile,
      skippedScanToModel: true,
    };
    update({ scannerFile: reusePromptFile, skippedScanToModel: true });
    persistOrderSnapshot(next);
    setReusePromptFile(null);
    onSkipScan();
  };

  const handleReuseScanNew = () => {
    if (!postSignupSnapshot.current) return;
    const next = {
      ...postSignupSnapshot.current,
      scannerFile: undefined,
      skippedScanToModel: false,
    };
    update({ scannerFile: undefined, skippedScanToModel: false });
    persistOrderSnapshot(next);
    setReusePromptFile(null);
    onContinue();
  };

  const submitProfileViaApi = async () => {
    if (!formReady || !customer.gender || isSubmitting) return;
    setSubmitError("");
    setIsSubmitting(true);
    try {
      const createPayload = {
        firstName: customer.firstName.trim(),
        lastName: customer.lastName.trim(),
        email: customer.email.trim(),
        gender: customer.gender,
      };

      const createResponse = await fetch(apiUrl("/v3/reference-customer/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload),
      });

      const createBody = await createResponse.json().catch(() => ({}));
      const isOk = createResponse.ok || createBody?.success === true;
      if (!isOk) {
        throw new Error(
          createBody?.message || `Signup failed (${createResponse.status})`,
        );
      }

      const userData = createBody?.data ?? {};
      const resolvedUserId = userData?.id;
      const resolvedFirstName = (userData?.firstName ?? customer.firstName).trim();
      const resolvedLastName = (userData?.lastName ?? customer.lastName).trim();
      const resolvedEmail = (userData?.email ?? customer.email).trim();

      const mergedCustomer = {
        ...customer,
        firstName: resolvedFirstName,
        lastName: resolvedLastName,
        name: `${resolvedFirstName} ${resolvedLastName}`.trim(),
        email: resolvedEmail,
      };

      update({
        customer: mergedCustomer,
        referenceCustomerId: resolvedUserId,
        scannerFile: undefined,
      });

      const mergedOrder: BespokeOrder = {
        ...order,
        customer: mergedCustomer,
        referenceCustomerId: resolvedUserId ?? order.referenceCustomerId,
        scannerFile: undefined,
      };
      syncKioskProfileForScantoolShell(mergedOrder);
      postSignupSnapshot.current = mergedOrder;

      let latest: ScannerFileData | null = null;
      if (resolvedUserId !== undefined && resolvedUserId !== null) {
        try {
          latest = await fetchLatestScreenerFile(resolvedUserId);
        } catch {
          /* ignore */
        }
      }

      if (latest) {
        setReusePromptFile(latest);
        setIsSubmitting(false);
        return;
      }

      persistOrderSnapshot(mergedOrder);
      setIsSubmitting(false);
      onContinue();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Nutzerdaten konnten nicht gespeichert werden.",
      );
      setIsSubmitting(false);
    }
  };

  const underlineInput =
    "w-full bg-transparent border-0 border-b-2 rounded-none py-2.5 text-[0.9375rem] leading-snug text-ivory placeholder:text-ivory/50 outline-none transition-[border-color,box-shadow,color] duration-500 ease-out border-b-ivory/55 focus:border-b-gold [text-shadow:0_1px_12px_oklch(0.02_0.002_60/0.95)] focus:shadow-[0_12px_36px_-12px_oklch(0.78_0.09_75/0.45)] [@media(max-height:780px)]:py-2 [@media(max-height:780px)]:text-sm sm:py-3 sm:text-base";

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2 }}
      className="absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-y-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      {onBack ? (
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, delay: 0.35, ease: "easeOut" }}
          className="fixed left-4 top-[max(1rem,env(safe-area-inset-top,0px))] z-40 md:left-8 md:top-9"
        >
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer rounded-full border border-ivory/18 bg-black/35 px-4 py-2 font-sans text-[0.58rem] font-medium uppercase tracking-[0.38em] text-gold/95 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55)] backdrop-blur-md transition-all duration-300 hover:border-gold/45 hover:bg-black/50 hover:text-ivory hover:shadow-[0_16px_48px_-10px_oklch(0.78_0.09_75/0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 sm:px-5 sm:py-2.5 sm:text-[0.62rem] sm:tracking-[0.42em] [@media(max-height:700px)]:px-3.5 [@media(max-height:700px)]:py-1.5 [@media(max-height:700px)]:text-[0.55rem]"
          >
            Zurück
          </button>
        </motion.div>
      ) : null}

      {/* Hero photograph */}
      <motion.img
        src={imageSrc(welcomeHero)}
        alt=""
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 3, ease: "easeOut" }}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, oklch(0.03 0.003 60 / 0.6) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, oklch(0.03 0.003 60 / 0.55) 45%, oklch(0.02 0.002 60 / 0.95) 100%)",
        }}
      />

      <div className="relative z-10 flex min-h-dvh flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pt-24 md:px-10 md:pb-12 md:pt-22 [@media(max-height:780px)]:pt-18 [@media(max-height:780px)]:pb-10">
        {/* Shrinks on short viewports so headline + CTA stay reachable via scroll */}
        <div
          className="grow min-h-[min(20dvh,8rem)] shrink [@media(max-height:780px)]:grow-0 [@media(max-height:780px)]:min-h-0"
          aria-hidden
        />
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mx-auto w-full max-w-lg shrink-0 pb-2 md:pb-4 [@media(max-height:780px)]:max-w-[min(100%,24rem)]"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="rounded-2xl border border-ivory/20 bg-black/50 px-4 py-6 shadow-[0_28px_80px_-24px_rgb(0,0,0,0.85)] backdrop-blur-sm md:px-8 md:py-8 [@media(max-height:780px)]:rounded-xl [@media(max-height:780px)]:px-4 [@media(max-height:780px)]:py-5">
          <motion.h2
            variants={fieldVariants}
            className="text-center font-medium text-ivory text-xs uppercase tracking-[0.38em] mb-5 md:mb-8 md:text-base md:tracking-[0.42em] [@media(max-height:780px)]:mb-4"
            style={{
              textShadow: "0 1px 18px oklch(0.02 0.002 60 / 0.95), 0 0 1px oklch(0.15 0.01 80 / 0.5)",
            }}
          >
            Ihre Angaben
          </motion.h2>

          <motion.div variants={fieldVariants} className="mb-6 text-center md:mb-10 [@media(max-height:780px)]:mb-5">
            <p className="text-ivory/90 text-[0.62rem] font-medium uppercase tracking-[0.34em] mb-3 [text-shadow:0_1px_10px_rgb(0,0,0,0.8)] md:mb-4 md:text-[0.7rem] md:tracking-[0.38em]">
              Geschlecht
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
              {(
                [
                  ["male", "Mann"],
                  ["female", "Frau"],
                ] as const
              ).map(([value, label]) => {
                const active = customer.gender === value;
                return (
                  <motion.button
                    key={value}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => patchCustomer({ gender: value })}
                    className={[
                      "cursor-pointer rounded-full px-6 py-2.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] transition-all duration-500 [text-shadow:0_1px_8px_rgb(0,0,0,0.5)] md:px-9 md:py-3 md:text-[0.72rem] md:tracking-[0.22em]",
                      active
                        ? "border-2 border-gold/80 bg-gold/95 text-obsidian shadow-[0_0_44px_-4px_oklch(0.78_0.09_75/0.55)] hover:bg-gold"
                        : "border-2 border-ivory/40 bg-black/55 text-ivory/90 hover:border-gold/40 hover:bg-black/65 hover:text-ivory",
                    ].join(" ")}
                  >
                    {label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={fieldVariants} className="mb-6 grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-7 md:mb-9 [@media(max-height:780px)]:gap-y-4">
            <UnderlineField
              label="Vorname"
              value={customer.firstName}
              onChange={setFirstName}
              autoComplete="given-name"
              className={underlineInput}
            />
            <UnderlineField
              label="Nachname"
              value={customer.lastName}
              onChange={setLastName}
              autoComplete="family-name"
              className={underlineInput}
            />
          </motion.div>

          <motion.div variants={fieldVariants} className="mb-6 md:mb-10 [@media(max-height:780px)]:mb-5">
            <UnderlineField
              label="E-Mail"
              type="email"
              value={customer.email}
              onChange={(email) => patchCustomer({ email })}
              autoComplete="email"
              className={underlineInput}
            />
          </motion.div>

          {submitError ? (
            <motion.p
              variants={fieldVariants}
              className="mb-6 text-center text-sm text-red-300/95 [text-shadow:0_1px_8px_rgb(0,0,0,0.9)]"
            >
              {submitError}
            </motion.p>
          ) : null}

          <motion.div variants={fieldVariants} className="flex items-start gap-3 sm:items-center">
            <button
              type="button"
              role="switch"
              aria-checked={customer.privacyAccepted}
              onClick={() => patchCustomer({ privacyAccepted: !customer.privacyAccepted })}
              className={[
                "relative h-8 w-13 shrink-0 cursor-pointer rounded-full ring-1 ring-inset transition-colors duration-300",
                customer.privacyAccepted
                  ? "bg-gold ring-gold/50"
                  : "bg-ivory/25 ring-ivory/35",
              ].join(" ")}
            >
              <motion.span
                layout
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className={[
                  "absolute top-1 h-6 w-6 rounded-full bg-ivory shadow-lg ring-1 ring-black/20",
                  customer.privacyAccepted ? "left-6" : "left-1",
                ].join(" ")}
              />
            </button>
            <span className="min-w-0 flex-1 text-left text-[0.6rem] leading-snug text-ivory/92 uppercase tracking-[0.16em] [text-shadow:0_1px_10px_rgb(0,0,0,0.75)] sm:text-[0.65rem] sm:tracking-[0.2em] md:text-[0.68rem] md:leading-relaxed md:tracking-[0.24em]">
              Ich stimme den Datenschutzrichtlinien zu
            </span>
          </motion.div>
          </div>
        </motion.div>

        <div className="mx-auto mt-5 flex w-full max-w-5xl shrink-0 flex-col items-center px-1 text-center md:mt-8 [@media(max-height:780px)]:mt-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.6, delay: 1.05, ease: "easeOut" }}
            className="font-serif text-ivory text-[clamp(1.2rem,3.2vw+0.75rem,4.25rem)] leading-[1.12] italic font-normal max-w-5xl lg:text-[clamp(1.35rem,4vw+0.5rem,4.85rem)]"
            style={{
              textShadow:
                "0 2px 24px oklch(0.02 0.002 60 / 0.9), 0 1px 2px oklch(0.02 0.002 60 / 0.8)",
              letterSpacing: "0.005em",
            }}
          >
            Jedes Paar beginnt mit Ihrem Maß.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, delay: 1.55, ease: "easeOut" }}
            className="text-gold/90 mt-3 text-[0.58rem] font-medium uppercase tracking-[0.32em] md:mt-6 md:text-xs md:tracking-[0.42em] [@media(max-height:780px)]:mt-3 [@media(max-height:780px)]:text-[0.55rem] [@media(max-height:780px)]:tracking-[0.28em]"
            style={{
              textShadow: "0 1px 12px oklch(0.02 0.002 60 / 0.9)",
            }}
          >
            Ein Schuh. Gemacht für Sie.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: 2.1 }}
          className="mt-6 flex justify-center pb-4 md:mt-10 md:pb-0 [@media(max-height:780px)]:mt-5"
        >
          <button
            type="button"
            disabled={!formReady || isSubmitting || reusePromptFile !== null}
            onClick={() => {
              void submitProfileViaApi();
            }}
            className={[
              "text-[0.65rem] md:text-xs font-medium uppercase transition-colors group pb-1.5 border-b",
              formReady && !isSubmitting && reusePromptFile === null
                ? "text-gold border-gold/50 hover:text-ivory hover:border-ivory/70 cursor-pointer"
                : "text-ivory/25 border-ivory/10 cursor-not-allowed",
            ].join(" ")}
            style={{ letterSpacing: "0.5em" }}
          >
            {isSubmitting ? "Bitte warten …" : "Fortfahren"}
          </button>
        </motion.div>
      </div>

      {reusePromptFile &&
      reusePromptFile.id !== undefined &&
      reusePromptFile.id !== null ? (
        <WelcomeReuseScanDialog
          scanDateLabel={reuseScanDateLabel}
          scanId={reusePromptFile.id}
          onUseExisting={handleReuseUseExisting}
          onScanNew={handleReuseScanNew}
        />
      ) : null}
    </motion.section>
  );
}

function UnderlineField({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  className: string;
}) {
  return (
    <label className="block text-left sm:col-span-1">
      <span className="mb-1.5 block text-[0.58rem] font-semibold uppercase tracking-[0.32em] text-ivory [text-shadow:0_1px_10px_rgb(0,0,0,0.85)] [@media(max-height:780px)]:mb-1 sm:mb-2 sm:text-[0.62rem] sm:tracking-[0.36em]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className={className}
      />
    </label>
  );
}
