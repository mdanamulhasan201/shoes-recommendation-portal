"use client";

import { useRouter } from "next/navigation";
import { WelcomeTransition } from "@/components/signature-ritual/atelier/WelcomeTransition";
import { ritualPath } from "@/components/signature-ritual/routes";

export function WelcomeStep() {
  const router = useRouter();
  return (
    <WelcomeTransition
      onContinue={() => router.push(ritualPath("scan"))}
      onSkipScan={() => router.push(ritualPath("model"))}
      onBack={() => router.push(ritualPath("idle"))}
    />
  );
}
