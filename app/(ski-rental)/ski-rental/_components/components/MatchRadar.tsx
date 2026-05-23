import { motion } from "framer-motion";

type Metrics = Record<string, number>;

export function MatchRadar({ metrics, size = 260 }: { metrics: Metrics; size?: number }) {
  const labels = Object.keys(metrics);
  const values = Object.values(metrics);
  const n = labels.length;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 36;

  const pt = (i: number, scale: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(a) * r * scale, cy + Math.sin(a) * r * scale] as const;
  };

  const polygon = values.map((v, i) => pt(i, v / 100).join(",")).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
      <defs>
        <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0.78 0.16 165)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="oklch(0.85 0.12 200)" stopOpacity="0.05" />
        </radialGradient>
      </defs>
      {/* concentric rings */}
      {[0.25, 0.5, 0.75, 1].map((s, i) => (
        <polygon
          key={i}
          points={Array.from({ length: n }, (_, k) => pt(k, s).join(",")).join(" ")}
          fill="none"
          stroke="oklch(1 0 0 / 0.06)"
          strokeWidth="1"
        />
      ))}
      {/* axes */}
      {labels.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="oklch(1 0 0 / 0.06)" />;
      })}
      {/* data */}
      <motion.polygon
        points={polygon}
        fill="url(#radarFill)"
        stroke="oklch(0.78 0.16 165)"
        strokeWidth="1.5"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        style={{
          filter: "drop-shadow(0 0 12px oklch(0.78 0.16 165 / 0.5))",
          transformOrigin: `${cx}px ${cy}px`,
        }}
      />
      {/* labels */}
      {labels.map((l, i) => {
        const [x, y] = pt(i, 1.18);
        return (
          <text
            key={l}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            {l}
          </text>
        );
      })}
      {/* points */}
      {values.map((v, i) => {
        const [x, y] = pt(i, v / 100);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={3}
            fill="oklch(0.98 0 0)"
            stroke="oklch(0.78 0.16 165)"
            strokeWidth="1.5"
          />
        );
      })}
    </svg>
  );
}
