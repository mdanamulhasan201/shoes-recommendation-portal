import { Suspense } from "react";
import { CustomizeStep } from "@/components/signature-ritual/steps/CustomizeStep";

function CustomizeLoading() {
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

export default function CustomizePage() {
  return (
    <Suspense fallback={<CustomizeLoading />}>
      <CustomizeStep />
    </Suspense>
  );
}
