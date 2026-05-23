import { motion } from "framer-motion";

type Props = {
  height?: number; // cm
  skiLength?: number; // cm
  color?: string; // hex / oklch
  kid?: boolean;
  helmet?: boolean;
  poles?: boolean;
};

// A stylised skier silhouette with skis whose length scales relative to body height.
// Visually communicates ski-length-vs-body — the central insight of the visualization.
export function SkierAvatar({
  height = 180,
  skiLength = 168,
  color = "oklch(0.78 0.16 165)",
  kid = false,
  helmet = true,
  poles = true,
}: Props) {
  // visual scale: 180cm body → 380px tall figure. Skis to scale with body.
  const px = (cm: number) => (cm / 180) * 380;
  const bodyH = px(height);
  const skiH = px(skiLength);

  return (
    <div className="relative flex items-end justify-center" style={{ height: bodyH + 60 }}>
      {/* glow halo */}
      <div
        className="absolute bottom-0 h-40 w-72 rounded-full blur-3xl"
        style={{ background: `${color}`, opacity: 0.18 }}
      />
      {/* skis behind body */}
      <div className="absolute bottom-0 flex items-end gap-10">
        <Ski height={skiH} color={color} delay={0.1} />
        <Ski height={skiH} color={color} delay={0.2} />
      </div>

      {/* body */}
      <motion.svg
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewBox="0 0 120 380"
        style={{ height: bodyH, width: bodyH * (120 / 380) }}
        className="relative z-10"
      >
        <defs>
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.96 0.005 200)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="oklch(0.40 0.01 240)" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {/* helmet/head */}
        {helmet ? (
          <ellipse
            cx="60"
            cy="34"
            rx="22"
            ry="22"
            fill="oklch(0.18 0.008 240)"
            stroke={color}
            strokeWidth="1.4"
          />
        ) : (
          <circle
            cx="60"
            cy="34"
            r="20"
            fill="oklch(0.20 0.008 240)"
            stroke="oklch(1 0 0 / 0.4)"
            strokeWidth="1"
          />
        )}
        {helmet && (
          <path d="M40 38 Q60 18 80 38" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
        )}
        {/* torso */}
        <path
          d={kid ? "M44 60 L76 60 L82 160 L38 160 Z" : "M40 60 L80 60 L84 180 L36 180 Z"}
          fill="url(#bodyGrad)"
          stroke="oklch(1 0 0 / 0.3)"
          strokeWidth="0.8"
        />
        {/* arms */}
        <line
          x1="40"
          y1="74"
          x2="22"
          y2={kid ? 150 : 180}
          stroke="oklch(1 0 0 / 0.7)"
          strokeWidth={kid ? 8 : 9}
          strokeLinecap="round"
        />
        <line
          x1="80"
          y1="74"
          x2="98"
          y2={kid ? 150 : 180}
          stroke="oklch(1 0 0 / 0.7)"
          strokeWidth={kid ? 8 : 9}
          strokeLinecap="round"
        />
        {/* pants */}
        <path
          d="M36 180 L60 200 L60 360 L46 360 Z"
          fill="oklch(0.16 0.008 240)"
          stroke="oklch(1 0 0 / 0.25)"
          strokeWidth="0.6"
        />
        <path
          d="M84 180 L60 200 L60 360 L74 360 Z"
          fill="oklch(0.16 0.008 240)"
          stroke="oklch(1 0 0 / 0.25)"
          strokeWidth="0.6"
        />
        {/* boots */}
        <rect x="42" y="358" width="18" height="14" rx="3" fill={color} opacity="0.8" />
        <rect x="60" y="358" width="18" height="14" rx="3" fill={color} opacity="0.8" />
      </motion.svg>

      {/* poles */}
      {poles && (
        <>
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="absolute bottom-0 origin-bottom"
            style={{
              left: "calc(50% - 90px)",
              width: 1.5,
              height: bodyH * 0.55,
              background: "oklch(1 0 0 / 0.7)",
            }}
          />
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="absolute bottom-0 origin-bottom"
            style={{
              right: "calc(50% - 90px)",
              width: 1.5,
              height: bodyH * 0.55,
              background: "oklch(1 0 0 / 0.7)",
            }}
          />
        </>
      )}

      {/* ground line */}
      <div className="absolute bottom-0 left-1/2 h-px w-[120%] -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      {/* measurement label */}
      <div
        className="absolute -right-2 bottom-0 flex flex-col items-end gap-1"
        style={{ height: skiH }}
      >
        <div className="h-full w-px bg-primary/30" />
      </div>
      <div
        className="absolute right-2 font-mono text-[10px] text-primary"
        style={{ bottom: skiH + 4 }}
      >
        {skiLength} CM
      </div>
      <div
        className="absolute -left-2 bottom-0 flex flex-col items-start"
        style={{ height: bodyH }}
      >
        <div className="h-full w-px bg-white/20" />
      </div>
      <div
        className="absolute left-2 font-mono text-[10px] text-muted-foreground"
        style={{ bottom: bodyH + 4 }}
      >
        {height} CM
      </div>
    </div>
  );
}

function Ski({ height, color, delay }: { height: number; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className="origin-bottom rounded-md"
      style={{
        width: 14,
        height,
        background: `linear-gradient(180deg, ${color} 0%, oklch(0.18 0.008 240) 100%)`,
        boxShadow: `0 0 30px ${color}`,
        clipPath: "polygon(0 4%, 100% 4%, 100% 92%, 50% 100%, 0 92%)",
      }}
    />
  );
}
