import { motion } from "framer-motion";
import { BackButton } from "@/components/signature-ritual/atelier/BackButton";
import type { BespokeOrder } from "./types";
import { MODEL_META } from "./types";
import { imageSrc } from "./imageSrc";
import oxford from "@/assets/shoe-oxford.png";
import derby from "@/assets/shoe-derby.png";
import loafer from "@/assets/shoe-loafer.png";
import monk from "@/assets/shoe-monk.png";
import sneaker from "@/assets/shoe-sneaker.png";

const IMAGES = {
  oxford: imageSrc(oxford),
  derby: imageSrc(derby),
  loafer: imageSrc(loafer),
  monk: imageSrc(monk),
  sneaker: imageSrc(sneaker),
} as const;

export function Confirmation({
  order,
  onReset,
  onBack,
  onPay,
  onRetry,
  checkoutLoading = false,
  checkoutRedirecting = false,
  checkoutError = null,
  checkoutReady = false,
  payButtonLabel = "Jetzt bezahlen",
}: {
  order: BespokeOrder;
  onReset: () => void;
  onBack?: () => void;
  /** Redirect to Stripe `checkoutUrl` from create-checkout-session. */
  onPay?: () => void;
  onRetry?: () => void;
  checkoutLoading?: boolean;
  checkoutRedirecting?: boolean;
  checkoutError?: string | null;
  checkoutReady?: boolean;
  payButtonLabel?: string;
}) {
  const img = order.model ? IMAGES[order.model] : imageSrc(oxford);
  const meta = order.model ? MODEL_META[order.model] : MODEL_META.oxford;
  const ref = `MV-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 3 }}
      className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto px-8 py-20"
    >
      {onBack ? <BackButton onClick={onBack} /> : null}
      <div className="absolute inset-0 vignette pointer-events-none" />

      <motion.img
        src={img}
        alt={meta.name}
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 0.18, scale: 1 }}
        transition={{ duration: 4 }}
        className="absolute max-h-[70vh] max-w-[80%] object-contain"
        style={{ filter: "blur(2px) brightness(0.6)" }}
      />

      <div className="relative z-10 text-center max-w-2xl">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 3 }}
          className="font-display text-ivory text-3xl md:text-5xl italic leading-tight"
        >
          Ihr Schuh wird nun für Sie gefertigt.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 1.5 }}
          className="font-display text-gold mt-4 text-2xl md:text-3xl italic"
        >
          Lieferung direkt zu Ihnen nach Hause.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 3 }}
          className="mt-16 space-y-6"
        >
          <div className="flex justify-center">
            <div className="h-px w-16 bg-gold/40" />
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-5 max-w-md mx-auto text-left">
            <Detail label="Referenz" value={ref} />
            <Detail label="Modell" value={meta.name} />
            <Detail label="Fertigung" value="6–8 Wochen" />
            <Detail label="Lieferung" value="Nach Vereinbarung" />
          </div>

          {order.deliveryAddress ? (
            <motion.div className="mx-auto mt-8 max-w-md rounded-sm border border-ivory/10 bg-black/35 p-5 text-left">
              <p className="text-gold-soft text-[0.55rem] tracking-[0.35em] uppercase">
                Lieferadresse
              </p>
              <p className="font-display mt-2 text-lg italic text-ivory">
                {order.deliveryAddress.description || "Adresse"}
                {order.deliveryAddress.isPrimary ? (
                  <span className="ml-2 align-middle text-[0.55rem] font-sans font-medium uppercase tracking-[0.16em] text-gold not-italic">
                    · Standard
                  </span>
                ) : null}
              </p>
              <p className="mt-2 text-sm text-ivory/70">{order.deliveryAddress.phone}</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ivory/55">
                {order.deliveryAddress.address}
              </p>
            </motion.div>
          ) : null}

          <div className="flex justify-center pt-4">
            <div className="h-px w-16 bg-gold/40" />
          </div>

          <p className="text-gold-soft text-[0.6rem] tracking-[0.4em] uppercase">
            Bestätigung per E-Mail an {order.customer.email || "Sie"}
          </p>

          {checkoutError ? (
            <motion.div className="mt-6 text-center">
              <p className="text-xs text-amber-200/90" role="alert">
                {checkoutError}
              </p>
              {onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-3 text-[0.58rem] uppercase tracking-[0.18em] text-gold hover:text-ivory"
                >
                  Erneut laden
                </button>
              ) : null}
            </motion.div>
          ) : null}

          <motion.div className="mt-10 flex flex-col items-center gap-4">
            <button
              type="button"
              disabled={!checkoutReady || checkoutLoading}
              onClick={() => onPay?.()}
              className="w-full max-w-sm rounded-sm border border-gold/40 bg-gold/15 px-6 py-4 font-sans text-[0.62rem] font-medium uppercase tracking-[0.28em] text-gold transition-all hover:border-gold/60 hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {checkoutRedirecting
                ? "Weiterleitung…"
                : checkoutLoading
                  ? "Warenkorb wird geladen…"
                  : payButtonLabel}
            </button>
            <p className="max-w-sm text-center text-[0.55rem] leading-relaxed text-ivory/40">
              {checkoutReady
                ? "Klick startet Stripe — nur Warenkorb-Zeilen und Lieferadresse."
                : "Warenkorb und gespeicherte Lieferadresse werden benötigt."}
            </p>
            <button
              type="button"
              onClick={onReset}
              className="text-muted-foreground text-[0.6rem] tracking-[0.4em] uppercase transition-colors hover:text-ivory border-b border-gold/20 pb-1"
            >
              Neue Bestellung
            </button>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-gold-soft text-[0.55rem] tracking-[0.4em] uppercase mb-1">{label}</div>
      <div className="font-display text-ivory text-lg italic">{value}</div>
    </div>
  );
}
