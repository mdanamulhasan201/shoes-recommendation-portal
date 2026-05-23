"use client";

import { useRouter } from "next/navigation";
import { CharacterSelection } from "@/components/signature-ritual/atelier/CharacterSelection";
import { useBespokeOrder } from "@/components/signature-ritual/BespokeOrderContext";
import {
  ritualPath,
  ritualPathWithPremiumId,
} from "@/components/signature-ritual/routes";

export function CharacterStep() {
  const router = useRouter();
  const { order, update } = useBespokeOrder();

  const shoeId = order.premiumReferenceShoeId?.trim();

  const handleBack = () => {
    if (shoeId) {
      router.push(ritualPathWithPremiumId("customize", shoeId));
      return;
    }
    router.push(ritualPath("customize"));
  };

  return (
    <CharacterSelection
      order={order}
      onUpdate={update}
      onBack={handleBack}
      onContinue={() => router.push(ritualPath("signature"))}
    />
  );
}
