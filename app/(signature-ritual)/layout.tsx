import type { Metadata, Viewport } from "next";

/** Same font loading as atelier-signature-ritual `src/routes/__root.tsx` (Google Fonts, not next/font). */
const ATELIER_GOOGLE_FONTS =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&family=Inter:wght@200;300;400;500&display=swap";

export const metadata: Metadata = {
  title: "Maison Volterra — Bespoke Atelier",
  description: "A private digital atelier. Crafted for one. Designed for you.",
  openGraph: {
    title: "Maison Volterra — Bespoke Atelier",
    description: "Commission a personal object of craftsmanship.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function SignatureRitualGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={ATELIER_GOOGLE_FONTS} />
      <div className="signature-ritual-scope min-h-dvh w-full max-w-[100vw] antialiased">{children}</div>
    </>
  );
}
