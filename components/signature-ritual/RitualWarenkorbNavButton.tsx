"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePremiumWarenkorbArticleCount } from "@/components/signature-ritual/usePremiumWarenkorbArticleCount";
import { SIGNATURE_RITUAL_BASE } from "@/components/signature-ritual/routes";

const WARENKORB_PATH = `${SIGNATURE_RITUAL_BASE}/warenkorb`;

export function RitualWarenkorbNavButton() {
  const pathname = usePathname();
  const count = usePremiumWarenkorbArticleCount();

  if (pathname === WARENKORB_PATH || pathname?.endsWith("/warenkorb")) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1.2, delay: 0.35, ease: "easeOut" }}
      className="fixed right-4 z-50 md:right-8"
      style={{ top: "max(1.25rem, env(safe-area-inset-top))" }}
    >
      <Link
        href={WARENKORB_PATH}
        className="relative inline-flex cursor-pointer items-center gap-2.5 rounded-full border border-ivory/18 bg-black/35 px-5 py-2.5 font-sans text-[0.62rem] font-medium uppercase tracking-[0.28em] text-[oklch(0.86_0.10_78)] shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55)] backdrop-blur-md transition-all duration-300 hover:border-[oklch(0.86_0.10_78/0.5)] hover:bg-black/50 hover:text-[oklch(0.97_0.018_85)] hover:shadow-[0_16px_48px_-10px_oklch(0.86_0.10_78/0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.86_0.10_78/0.35)]"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="shrink-0 opacity-95"
        >
          <path
            d="M6 7h15l-1.5 9H7.5L6 7zm0 0L5 3H2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9" cy="20" r="1" fill="currentColor" />
          <circle cx="18" cy="20" r="1" fill="currentColor" />
        </svg>
        <span>Warenkorb</span>
        {count > 0 ? (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[oklch(0.78_0.09_75)] px-1 text-[9px] font-bold tabular-nums text-black shadow-[0_0_0_2px_#0a0a0a]"
            aria-label={`${count} Artikel`}
          >
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </Link>
    </motion.div>
  );
}
