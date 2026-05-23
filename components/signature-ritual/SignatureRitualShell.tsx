"use client";

import { usePathname } from "next/navigation";
import { BespokeOrderProvider } from "@/components/signature-ritual/BespokeOrderContext";
import { PremiumShoeProvider } from "@/components/signature-ritual/PremiumShoeContext";
import { RitualWarenkorbNavButton } from "@/components/signature-ritual/RitualWarenkorbNavButton";

/**
 * No route-level AnimatePresence / opacity — that caused a full black gap between steps
 * (`mode="wait"` exits before enter). Each atelier screen keeps its own `motion` transitions.
 */
export function SignatureRitualShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const hideWarenkorbNav = pathname.includes("/order-tracking");

  return (
    <BespokeOrderProvider>
      <PremiumShoeProvider>
        <main
          className={
            hideWarenkorbNav
              ? "grain relative h-dvh min-h-0 w-screen max-w-[100vw] overflow-y-auto overflow-x-hidden bg-background font-sans text-foreground antialiased"
              : "grain relative h-screen min-h-dvh w-screen max-w-[100vw] overflow-hidden bg-background font-sans text-foreground antialiased"
          }
        >
          {hideWarenkorbNav ? null : <RitualWarenkorbNavButton />}
          {children}
        </main>
      </PremiumShoeProvider>
    </BespokeOrderProvider>
  );
}
