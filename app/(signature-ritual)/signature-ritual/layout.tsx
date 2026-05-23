import type { ReactNode } from "react";
import { SignatureRitualShell } from "@/components/signature-ritual/SignatureRitualShell";

export default function SignatureRitualNestedLayout({ children }: { children: ReactNode }) {
  return <SignatureRitualShell>{children}</SignatureRitualShell>;
}
