"use client";

import { useRouter } from "next/navigation";
import { Signature } from "@/components/signature-ritual/atelier/Signature";
import { useBespokeOrder } from "@/components/signature-ritual/BespokeOrderContext";
import { ritualPath } from "@/components/signature-ritual/routes";

export function SignatureStep() {
  const router = useRouter();
  const { order, update } = useBespokeOrder();

  return (
    <Signature
      value={order.signature}
      onChange={(signature) => update({ signature })}
      onBack={() => router.push(ritualPath("character"))}
      onContinue={() => router.push(ritualPath("reveal"))}
    />
  );
}
