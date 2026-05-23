import { motion } from "framer-motion";

// 3D-ish boot fit visualization: footprint with glowing pressure zones.
// Each zone is rated 0–100; color/intensity reflects fit quality.
export type FitZone = {
  label: string;
  x: number; // %
  y: number; // %
  value: number; // 0..100
  size?: number;
};

const DEFAULT_ZONES: FitZone[] = [
  { label: "Toe room", x: 50, y: 88, value: 92, size: 60 },
  { label: "Forefoot width", x: 50, y: 70, value: 88, size: 80 },
  { label: "Arch support", x: 50, y: 48, value: 95 },
  { label: "Heel hold", x: 50, y: 18, value: 96, size: 56 },
  { label: "Ankle wrap", x: 50, y: 30, value: 90, size: 50 },
];

export function BootFit({ zones = DEFAULT_ZONES }: { zones?: FitZone[] }) {
  return (
    <div className="grid gap-8 md:grid-cols-[1fr_1fr]">
      <div className="relative mx-auto h-[420px] w-[220px]">
        {/* footprint outline */}
        <svg viewBox="0 0 200 400" className="absolute inset-0 h-full w-full">
          <defs>
            <radialGradient id="fglow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(0.78 0.16 165)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="oklch(0.78 0.16 165)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="100" cy="200" rx="90" ry="180" fill="url(#fglow)" />
          <path
            d="M100 30 C70 30 55 70 58 130 C60 180 50 230 55 290 C58 340 75 380 100 380 C125 380 142 340 145 290 C150 230 140 180 142 130 C145 70 130 30 100 30 Z"
            fill="oklch(0.10 0.008 240 / 0.5)"
            stroke="oklch(0.78 0.16 165 / 0.6)"
            strokeWidth="1.5"
          />
          {/* anatomical guide lines */}
          {[100, 180, 240, 300].map((y) => (
            <line
              key={y}
              x1="60"
              y1={y}
              x2="140"
              y2={y}
              stroke="oklch(1 0 0 / 0.06)"
              strokeWidth="0.6"
              strokeDasharray="2 4"
            />
          ))}
        </svg>

        {/* heat zones */}
        {zones.map((z, i) => {
          const sz = z.size ?? 70;
          const intensity = z.value / 100;
          return (
            <motion.div
              key={z.label}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 0.9, 0.7], scale: [0.6, 1.05, 1] }}
              transition={{
                duration: 1.4,
                delay: i * 0.18,
                repeat: Infinity,
                repeatType: "reverse",
                repeatDelay: 1.6,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${z.x}%`,
                top: `${z.y}%`,
                width: sz,
                height: sz,
                background: `radial-gradient(circle, oklch(0.78 0.16 165 / ${0.55 * intensity}) 0%, oklch(0.85 0.12 200 / ${0.25 * intensity}) 50%, transparent 75%)`,
                filter: "blur(2px)",
              }}
            />
          );
        })}

        {/* sweep line */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <motion.div
            className="absolute inset-x-0 h-24"
            style={{
              background:
                "linear-gradient(180deg, transparent, oklch(0.78 0.16 165 / 0.25), transparent)",
            }}
            animate={{ y: ["-20%", "120%"] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>

      <div>
        <span className="label-mono">// PRESSURE ZONES · LIVE FIT MAP</span>
        <h3 className="mt-2 font-display text-2xl font-semibold">Why this boot fits you</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Color intensity shows how well your scan matches the boot's last in each anatomical
          region.
        </p>
        <ul className="mt-6 space-y-3">
          {zones.map((z) => (
            <li key={z.label} className="flex items-center gap-4">
              <span
                className="h-3 w-3 rounded-full"
                style={{
                  background: `oklch(0.78 0.16 165 / ${z.value / 100})`,
                  boxShadow: `0 0 12px oklch(0.78 0.16 165 / ${z.value / 110})`,
                }}
              />
              <span className="flex-1 font-display text-sm">{z.label}</span>
              <span className="font-mono text-xs text-muted-foreground">{z.value}/100</span>
              <div className="ml-2 h-1.5 w-24 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  style={{ width: `${z.value}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
