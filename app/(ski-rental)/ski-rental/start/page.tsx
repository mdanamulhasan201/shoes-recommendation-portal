"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Particles } from "@/ski-rental/components/Particles";
import { LangSelector } from "@/ski-rental/components/LangSelector";
import { useGroup } from "@/ski-rental/lib/session";
import { t } from "@/ski-rental/lib/i18n";

export default function Start() {
  const g = useGroup();

  const opts: {
    to: "/ski-rental/pickup" | "/ski-rental/group" | "/ski-rental/return";
    tag: string;
    title: string;
    line: string;
    desc: string;
    icon: React.ReactNode;
    primary?: boolean;
  }[] = [
    {
      to: "/ski-rental/pickup",
      tag: "01",
      title: t(g.language, "pickup"),
      line: "Already booked? Scan or enter your code.",
      desc: "Mobile · hotel · resort terminal.",
      icon: <PickupIcon />,
    },
    {
      to: "/ski-rental/group",
      tag: "02",
      title: t(g.language, "new_rental"),
      line: "Solo · couple · family · group.",
      desc: "Add up to 8 people · single payment.",
      icon: <RentalIcon />,
      primary: true,
    },
    {
      to: "/ski-rental/return",
      tag: "03",
      title: t(g.language, "return"),
      line: "Drop off in seconds.",
      desc: "Scan QR · drying · check-in.",
      icon: <ReturnIcon />,
    },
  ];

  return (
    <main className="relative min-h-dvh min-h-screen overflow-x-hidden">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <Particles density={60} />
      <div className="absolute inset-x-0 top-0 h-[50vh] bg-[radial-gradient(circle_at_50%_10%,oklch(0.78_0.16_165/0.18),transparent_70%)] sm:h-[60vh]" />

      <header className="relative z-10 flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-8 lg:px-10">
        <Link href="/ski-rental" className="flex items-center gap-3">
          <span className="relative flex h-7 w-7 items-center justify-center">
            <span className="absolute inset-0 rounded-md bg-primary/20 blur-md" />
            <span className="relative h-3 w-3 rounded-sm bg-primary glow-ring" />
          </span>
          <span className="font-display text-sm font-semibold tracking-[0.32em] sm:tracking-[0.42em]">
            FEETFIRST
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end sm:gap-4">
          <span className="label-mono text-xs sm:text-[0.68rem]">SELECT EXPERIENCE</span>
          <LangSelector />
        </div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-4 sm:px-6 lg:max-w-7xl lg:py-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex w-full max-w-4xl flex-col items-center overflow-visible text-center lg:max-w-5xl"
        >
          <p className="label-mono mb-2 text-primary lg:mb-3">
            {'// TERMINAL · STEP 1'}
          </p>
          <h1 className="mx-auto w-full max-w-[min(100%,52rem)] overflow-visible text-balance text-center font-display text-[clamp(1.35rem,4.2vw,3.25rem)] font-semibold leading-[1.15] tracking-tight">
            <span className="text-foreground">{t(g.language, "welcome")}.</span>{' '}
            <span className="text-emerald-gradient">What brings you here?</span>
          </h1>
        </motion.div>
        <p className="mt-3 max-w-md text-center text-sm text-muted-foreground sm:text-base lg:mt-4 lg:max-w-lg lg:text-[0.95rem]">
          Touch a card to begin. The AI takes care of the rest.
        </p>

        <div className="mt-6 grid w-full auto-rows-fr gap-3 sm:mt-8 sm:gap-4 md:grid-cols-3 md:items-stretch lg:mt-7 lg:gap-5">
          {opts.map((o, i) => (
            <motion.div
              key={o.to}
              className="flex h-full"
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 + i * 0.1 }}
            >
              <Link
                href={o.to}
                className={`group glass-strong relative flex h-full min-h-[20rem] w-full flex-col overflow-hidden rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_0_80px_oklch(0.78_0.16_165/0.25)] sm:min-h-[22rem] sm:rounded-[2rem] sm:p-8 md:min-h-0 md:p-10 ${
                  o.primary ? "border-primary/30" : ""
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                <div className="relative flex min-h-0 flex-1 flex-col">
                  <div className="flex min-h-[2.75rem] items-start justify-between gap-2">
                    <span className="label-mono shrink-0">OPTION {o.tag}</span>
                    {o.primary ? (
                      <span className="max-w-[55%] rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-right label-mono text-[0.58rem] leading-tight text-primary sm:max-w-none sm:text-[0.68rem]">
                        FAMILY · GROUP
                      </span>
                    ) : (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary glow-ring" />
                    )}
                  </div>
                  <div className="mt-6 shrink-0 text-primary sm:mt-8 [&_svg]:h-12 [&_svg]:w-12 sm:[&_svg]:h-16 sm:[&_svg]:w-16">
                    {o.icon}
                  </div>
                  <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight sm:mt-8 sm:text-4xl md:text-5xl">
                    {o.title}
                  </h2>
                  <p className="mt-3 line-clamp-2 text-base text-primary sm:mt-4 sm:text-lg">
                    {o.line}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground sm:text-base">
                    {o.desc}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-8 sm:pt-10 md:pt-12">
                    <span className="font-display text-xs tracking-[0.28em] sm:text-sm sm:tracking-[0.42em]">
                      TAP TO ENTER
                    </span>
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-xl text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground sm:h-14 sm:w-14 sm:text-2xl">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <Link
          href="/ski-rental"
          className="mt-6 shrink-0 label-mono text-[0.65rem] hover:text-foreground sm:mt-8 lg:mt-5"
        >
          ← RETURN TO ATTRACT
        </Link>
      </section>
    </main>
  );
}

function PickupIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="h-12 w-12 sm:h-16 sm:w-16">
      <rect x="10" y="10" width="44" height="44" rx="6" stroke="currentColor" strokeWidth="1.5" />
      <rect x="18" y="18" width="10" height="10" fill="currentColor" />
      <rect x="36" y="18" width="10" height="10" fill="currentColor" />
      <rect x="18" y="36" width="10" height="10" fill="currentColor" />
      <rect x="36" y="36" width="4" height="4" fill="currentColor" />
      <rect x="42" y="42" width="4" height="4" fill="currentColor" />
    </svg>
  );
}
function RentalIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="h-12 w-12 sm:h-16 sm:w-16">
      <circle cx="22" cy="40" r="10" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="42" cy="40" r="10" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="32" cy="20" r="8" stroke="currentColor" strokeWidth="1.5" />
      <line x1="22" y1="40" x2="32" y2="28" stroke="currentColor" strokeWidth="1.2" />
      <line x1="42" y1="40" x2="32" y2="28" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
function ReturnIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="h-12 w-12 sm:h-16 sm:w-16">
      <path
        d="M44 16 H22 a14 14 0 1 0 0 28 H40"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M28 8 L20 16 L28 24"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="50" cy="48" r="4" fill="currentColor" />
    </svg>
  );
}
