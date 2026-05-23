"use client";

import { useRouter } from "next/navigation";
import { IdleScreen } from "@/components/signature-ritual/atelier/IdleScreen";
import { ritualPath } from "@/components/signature-ritual/routes";

export function IdleStep() {
  const router = useRouter();
  return (
    <IdleScreen
      onBegin={() => router.push(ritualPath("welcome"))}
      onBack={() => router.push("/")}
    />
  );
}
