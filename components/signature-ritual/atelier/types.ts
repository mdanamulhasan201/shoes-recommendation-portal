import type { ScannerFileData } from "@/app/kiosk/flow-state";

export type ShoeModel = "oxford" | "derby" | "loafer" | "monk" | "sneaker";

export type CustomerGender = "male" | "female";

export type Customer = {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  address: string;
  gender: CustomerGender | null;
  privacyAccepted: boolean;
};


export type LastShape = "round" | "square" | "almond";

export type PatinaTechnique = "marble" | "papiro" | "regular" | "museum";

/** Full editorial tonality rail (standard calf). Legacy 5-way values migrate on load. */
export const LEATHER_TONALITIES = [
  "black",
  "dark-brown",
  "medium-brown",
  "cognac",
  "light-brown",
  "mustard",
  "burgundy",
  "red",
  "forest",
  "olive",
  "grey",
  "dark-blue",
  "navy",
] as const;

export type LeatherTonality = (typeof LEATHER_TONALITIES)[number];

/** Maps old session `color` values to the new tonality ids. */
export function normalizeLeatherTonality(raw: unknown): LeatherTonality {
  const legacy: Record<string, LeatherTonality> = {
    obsidian: "black",
    cognac: "cognac",
    oxblood: "burgundy",
    ivory: "light-brown",
    olive: "olive",
  };
  if (
    typeof raw === "string" &&
    (LEATHER_TONALITIES as readonly string[]).includes(raw)
  ) {
    return raw as LeatherTonality;
  }
  if (typeof raw === "string" && legacy[raw]) return legacy[raw];
  return "black";
}

/** Subtle shoe preview tint for reveal / character steps. */
export function tonalityImageFilter(c: LeatherTonality): string {
  switch (c) {
    case "black":
    case "dark-brown":
    case "dark-blue":
    case "navy":
    case "grey":
      return "brightness(0.86) saturate(0.62)";
    case "medium-brown":
    case "cognac":
    case "light-brown":
    case "mustard":
      return "brightness(1.04) saturate(1.2) hue-rotate(-6deg) sepia(0.14)";
    case "burgundy":
    case "red":
      return "brightness(0.9) saturate(1.38) hue-rotate(-12deg) sepia(0.22)";
    case "forest":
    case "olive":
      return "brightness(0.94) saturate(0.9) hue-rotate(20deg) sepia(0.18)";
    default:
      return "";
  }
}

export type BespokeOrder = {
  model: ShoeModel | null;
  leather: "calf" | "suede" | "exotic";
  color: LeatherTonality;
  sole: "leather" | "rubber" | "mixed";
  stitching: "tone" | "contrast";
  finish: "matte" | "polished" | "patina";
  last: LastShape;
  signature: string;
  customer: Customer;
  /** Premium shoe id from first-view / get-details. */
  premiumReferenceShoeId?: string;
  /** API `model_type` from model step (e.g. OXFORD). */
  premiumModelType?: string;
  /** Skip last step → silhouette notice (3rd / 5th model card). */
  premiumSilhouetteFlow?: boolean;
  /** Active `leather_type.id` from get-details. */
  selectedLeatherTypeId?: string;
  /** API leather color id when customizing from premium data. */
  premiumColorId?: string;
  /** API `leather_variants` id when patina type is selected. */
  premiumPatinaVariantId?: string;
  /** When `finish === "patina"`: hand-patina technique. */
  patinaTechnique?: PatinaTechnique;
  /** When `finish === "patina"`: composite id from `PATINA_PALETTES`. */
  patinaColor?: string;
  /** Kiosk-aligned API: `reference_customer.id` after `/v3/reference-customer/create`. */
  referenceCustomerId?: string | number;
  /** Optional reused screener file (prior scan); set when user confirms reuse. */
  scannerFile?: ScannerFileData;
  /** Model step back target: welcome when user skipped scan via reuse prompt. */
  skippedScanToModel?: boolean;
  /** Selected premium delivery address after checkout. */
  deliveryAddress?: {
    id: string;
    phone: string;
    address: string;
    description: string;
    isPrimary?: boolean;
  } | null;
};

export const INITIAL_BESPOKE_ORDER: BespokeOrder = {
  model: null,
  leather: "calf",
  color: "black",
  sole: "leather",
  stitching: "tone",
  finish: "polished",
  last: "almond",
  signature: "",
  customer: {
    firstName: "",
    lastName: "",
    name: "",
    email: "",
    address: "",
    gender: null,
    privacyAccepted: false,
  },
};

export const LAST_META: Record<LastShape, { name: string; tagline: string }> = {
  round: { name: "Rund", tagline: "Sanft. Klassisch. Vertraut." },
  square: { name: "Eckig", tagline: "Markant. Architektonisch. Präsent." },
  almond: { name: "Mandel", tagline: "Elegant. Verlängernd. Diskret." },
};

export const MODEL_META: Record<
  ShoeModel,
  { name: string; tagline: string; image: string }
> = {
  oxford: { name: "Oxford", tagline: "Zeitlose Struktur", image: "" },
  derby: { name: "Derby", tagline: "Verfeinerte Leichtigkeit", image: "" },
  loafer: { name: "Loafer", tagline: "Stille Eleganz", image: "" },
  monk: { name: "Monk Strap", tagline: "Markantes Detail", image: "" },
  sneaker: { name: "Minimal Sneaker", tagline: "Moderne Zurückhaltung", image: "" },
};

export const COLOR_META: Record<
  LeatherTonality,
  { name: string; hex: string; whisper: string }
> = {
  black: { name: "Black", hex: "#0a0908", whisper: "Seidiges Schwarz" },
  "dark-brown": {
    name: "Dark Brown",
    hex: "#2a170c",
    whisper: "Espresso",
  },
  "medium-brown": {
    name: "Medium Brown",
    hex: "#6e3a22",
    whisper: "Warmes Mahagoni",
  },
  cognac: { name: "Cognac", hex: "#9a5224", whisper: "Saddle Amber" },
  "light-brown": {
    name: "Light Brown",
    hex: "#b08a64",
    whisper: "Sandiges Taupe",
  },
  mustard: {
    name: "Mustard",
    hex: "#b07a2c",
    whisper: "Weiches Senf-Karamell",
  },
  burgundy: {
    name: "Burgundy",
    hex: "#3e1418",
    whisper: "Reifer Bordeaux",
  },
  red: { name: "Red", hex: "#6a1c1f", whisper: "Tiefes Lederrot" },
  forest: { name: "Forest", hex: "#1f3326", whisper: "Tiefes Waldgrün" },
  olive: { name: "Olive", hex: "#4a4626", whisper: "Erdiges Olivgrün" },
  grey: { name: "Grey", hex: "#6a6a6c", whisper: "Seidiges Graphit" },
  "dark-blue": {
    name: "Dark Blue",
    hex: "#0e1420",
    whisper: "Mitternacht",
  },
  navy: { name: "Navy", hex: "#1c2c4a", whisper: "Marine" },
};
