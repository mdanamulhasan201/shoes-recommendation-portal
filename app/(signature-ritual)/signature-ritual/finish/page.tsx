import { Suspense } from "react";
import { FinishStep } from "@/components/signature-ritual/steps/FinishStep";

function FinishLoading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <p
        className="text-xs tracking-[0.25em] uppercase"
        style={{ color: "oklch(0.82 0.04 72)" }}
      >
        Lädt…
      </p>
    </div>
  );
}

export default function FinishPage() {
  return (
    <Suspense fallback={<FinishLoading />}>
      <FinishStep />
    </Suspense>
  );
}
