"use client";

import { useRouter } from "next/navigation";
import { CinematicReveal } from "@/components/signature-ritual/atelier/CinematicReveal";
import { useBespokeOrder } from "@/components/signature-ritual/BespokeOrderContext";
import { ritualPath } from "@/components/signature-ritual/routes";

export function RevealStep() {
  const router = useRouter();
  const { order } = useBespokeOrder();

  return (
    <CinematicReveal
      order={order}
      onBack={() => router.push(ritualPath("signature"))}
      onContinue={() => router.push(ritualPath("checkout"))}
    />
  );
}
