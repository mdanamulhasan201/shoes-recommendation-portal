export const SIGNATURE_RITUAL_BASE = "/signature-ritual" as const;

export const RITUAL_STEPS = [
  "idle",
  "welcome",
  "scan",
  "model",
  "silhouette",
  "last",
  "oxford-finish",
  "finish",
  "customize",
  "character",
  "signature",
  "reveal",
  "checkout",
  "confirm",
] as const;

export type RitualStep = (typeof RITUAL_STEPS)[number];

export function ritualPath(step: RitualStep): string {
  return `${SIGNATURE_RITUAL_BASE}/${step}`;
}

export const ritualWarenkorbPath = `${SIGNATURE_RITUAL_BASE}/warenkorb` as const;

/** Premium shoe id for `GET /v3/premium-shoe/get-details/{id}`. */
export function ritualPathWithPremiumId(step: RitualStep, premiumShoeId: string): string {
  const id = premiumShoeId.trim();
  if (!id) return ritualPath(step);
  return `${ritualPath(step)}?id=${encodeURIComponent(id)}`;
}

export function isRitualStep(segment: string): segment is RitualStep {
  return (RITUAL_STEPS as readonly string[]).includes(segment);
}
