import { useEffect, useState, useMemo } from 'react'

interface FootOutlineProps {
  side: 'left' | 'right'
  progress: number // 0–1
  showLabel?: boolean
}



const FootOutline = ({
  side,
  progress,
  showLabel = true
}: FootOutlineProps) => {
  const [scanY, setScanY] = useState(0)
  const [breathe, setBreathe] = useState(0)
  const [time, setTime] = useState(0)

  useEffect(() => {
    let frame: number
    let start: number | null = null

    const animate = (ts: number) => {
      if (!start) start = ts
      const elapsed = ts - start
      setScanY((elapsed % 3800) / 3800)
      setBreathe(Math.sin((elapsed / 5000) * Math.PI * 2) * 0.5 + 0.5)
      setTime(elapsed)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [])

  const mirror = side === 'right'
  const stabilize = Math.min(progress * 1.5, 1)
  const uid = useMemo(
    () => `foot-${side}-${Math.random().toString(36).slice(2, 8)}`,
    [side]
  )

  const breatheScale = 1 + breathe * 0.006
  const outerGlow = 0.35 + progress * 0.45
  const fillOpacity = 0.04 + progress * 0.08

  // Contour layers with progressive depth
  const contourLayers = [
    { scale: 0.94, offsetY: -1, opacity: 0.12 + progress * 0.2, width: 0.7 },
    { scale: 0.86, offsetY: -2.5, opacity: 0.09 + progress * 0.16, width: 0.6 },
    { scale: 0.76, offsetY: -4, opacity: 0.06 + progress * 0.13, width: 0.5 },
    { scale: 0.64, offsetY: -5.5, opacity: 0.04 + progress * 0.1, width: 0.4 },
    { scale: 0.5, offsetY: -7, opacity: 0.03 + progress * 0.07, width: 0.35 },
    { scale: 0.34, offsetY: -8, opacity: 0.02 + progress * 0.05, width: 0.3 }
  ]

  const pressureZones = [
    { cx: 100, cy: 365, r: 26, label: 'heel' },
    { cx: 68, cy: 115, r: 20, label: 'ball-l' },
    { cx: 138, cy: 125, r: 17, label: 'ball-r' },
    { cx: 100, cy: 48, r: 14, label: 'toe' }
  ]

  // Pulse for pressure zones
  const pulse = Math.sin((time / 1800) * Math.PI * 2) * 0.5 + 0.5

  return (
    <div className='relative w-full h-full flex items-center justify-center'>
      {/* Background depth grid with perspective */}
      <svg
        className='absolute inset-0 w-full h-full'
        style={{ opacity: 0.04 + progress * 0.05 }}
      >
        <defs>
          <pattern
            id={`grid-${uid}`}
            width='50'
            height='50'
            patternUnits='userSpaceOnUse'
          >
            <path
              d='M 50 0 L 0 0 0 50'
              fill='none'
              stroke='hsl(153 27% 51%)'
              strokeWidth='0.25'
            />
          </pattern>
          <radialGradient id={`grid-fade-${uid}`}>
            <stop offset='0%' stopColor='white' stopOpacity='1' />
            <stop offset='55%' stopColor='white' stopOpacity='0.5' />
            <stop offset='100%' stopColor='white' stopOpacity='0' />
          </radialGradient>
          <mask id={`grid-mask-${uid}`}>
            <rect width='100%' height='100%' fill={`url(#grid-fade-${uid})`} />
          </mask>
        </defs>
        <rect
          width='100%'
          height='100%'
          fill={`url(#grid-${uid})`}
          mask={`url(#grid-mask-${uid})`}
        />
      </svg>

      {/* Ambient radial glow behind foot */}
      <div
        className='absolute z-5 pointer-events-none rounded-full'
        style={{
          width: '60%',
          height: '70%',
          background: `radial-gradient(ellipse at 50% 48%, hsl(153 27% 51% / ${
            0.03 + progress * 0.06
          }) 0%, hsl(153 27% 51% / ${
            0.01 + progress * 0.02
          }) 40%, transparent 70%)`,
          transition: 'background 0.8s ease-out'
        }}
      />

      {/* Main foot SVG */}
      <svg
        viewBox='-20 -25 240 480'
        className='relative z-10'
        style={{
          width: 'clamp(170px, 19vw, 280px)',
          height: 'auto',
          transform: `${mirror ? 'scaleX(-1) ' : ''}scale(${breatheScale})`,
          filter: `drop-shadow(0 0 ${14 + progress * 25}px hsl(153 27% 51% / ${
            0.15 + progress * 0.2
          }))`,
          transition: 'filter 0.6s ease-out'
        }}
      >
        <defs>
          {/* Volumetric scan gradient — wide soft beam */}
          <linearGradient id={`scan-beam-${uid}`} x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor='hsl(153 27% 51%)' stopOpacity='0' />
            <stop
              offset={`${Math.max(0, scanY * 100 - 18)}%`}
              stopColor='hsl(153 27% 51%)'
              stopOpacity='0'
            />
            <stop
              offset={`${Math.max(0, scanY * 100 - 8)}%`}
              stopColor='hsl(153 27% 51%)'
              stopOpacity={0.05 + progress * 0.06}
            />
            <stop
              offset={`${Math.max(0, scanY * 100 - 2)}%`}
              stopColor='hsl(153 27% 51%)'
              stopOpacity={0.2 + progress * 0.25}
            />
            <stop
              offset={`${scanY * 100}%`}
              stopColor='hsl(153 40% 55%)'
              stopOpacity={0.6 + progress * 0.3}
            />
            <stop
              offset={`${Math.min(100, scanY * 100 + 2)}%`}
              stopColor='hsl(153 27% 51%)'
              stopOpacity={0.2 + progress * 0.25}
            />
            <stop
              offset={`${Math.min(100, scanY * 100 + 8)}%`}
              stopColor='hsl(153 27% 51%)'
              stopOpacity={0.05 + progress * 0.06}
            />
            <stop
              offset={`${Math.min(100, scanY * 100 + 18)}%`}
              stopColor='hsl(153 27% 51%)'
              stopOpacity='0'
            />
            <stop offset='100%' stopColor='hsl(153 27% 51%)' stopOpacity='0' />
          </linearGradient>

          {/* Inner volumetric glow — center brightness */}
          <radialGradient id={`vol-glow-${uid}`} cx='0.5' cy='0.46' r='0.42'>
            <stop
              offset='0%'
              stopColor='hsl(153 35% 58%)'
              stopOpacity={0.1 + progress * 0.14}
            />
            <stop
              offset='35%'
              stopColor='hsl(153 27% 51%)'
              stopOpacity={0.04 + progress * 0.06}
            />
            <stop
              offset='70%'
              stopColor='hsl(153 27% 45%)'
              stopOpacity={0.01 + progress * 0.03}
            />
            <stop offset='100%' stopColor='hsl(153 27% 40%)' stopOpacity='0' />
          </radialGradient>

          {/* Outer soft fill — body volume */}
          <radialGradient id={`body-fill-${uid}`} cx='0.5' cy='0.47' r='0.52'>
            <stop
              offset='0%'
              stopColor='hsl(153 30% 52%)'
              stopOpacity={fillOpacity * 1.2}
            />
            <stop
              offset='50%'
              stopColor='hsl(153 25% 45%)'
              stopOpacity={fillOpacity * 0.6}
            />
            <stop
              offset='100%'
              stopColor='hsl(153 20% 38%)'
              stopOpacity={fillOpacity * 0.15}
            />
          </radialGradient>

          {/* Ground shadow */}
          <radialGradient id={`ground-${uid}`} cx='0.5' cy='0.5' r='0.5'>
            <stop
              offset='0%'
              stopColor='hsl(153 27% 51%)'
              stopOpacity={0.12 + progress * 0.1}
            />
            <stop
              offset='50%'
              stopColor='hsl(153 27% 45%)'
              stopOpacity={0.04 + progress * 0.04}
            />
            <stop offset='100%' stopColor='hsl(153 27% 40%)' stopOpacity='0' />
          </radialGradient>

          {/* Scan reveal mask */}
          <linearGradient id={`reveal-${uid}`} x1='0' y1='0' x2='0' y2='1'>
            <stop
              offset='0%'
              stopColor='white'
              stopOpacity={scanY > 0.1 ? 1 : 0}
            />
            <stop
              offset={`${Math.min(scanY * 100, 100)}%`}
              stopColor='white'
              stopOpacity='1'
            />
            <stop
              offset={`${Math.min(scanY * 100 + 5, 100)}%`}
              stopColor='white'
              stopOpacity='0'
            />
            <stop offset='100%' stopColor='white' stopOpacity='0' />
          </linearGradient>

          <clipPath id={`clip-${uid}`}>
            <path d={footPath} />
          </clipPath>

          <mask id={`reveal-mask-${uid}`}>
            <rect
              x='-20'
              y='-25'
              width='240'
              height='480'
              fill={`url(#reveal-${uid})`}
            />
          </mask>
        </defs>

        {/* ── GROUND PLANE ── */}
        <ellipse
          cx='100'
          cy='425'
          rx={72 + progress * 10}
          ry={14 + progress * 6}
          fill={`url(#ground-${uid})`}
          opacity={0.6 + progress * 0.3}
          style={{ transition: 'opacity 0.6s ease-out' }}
        />
        {/* Ground reflection line */}
        <line
          x1={30}
          y1={420}
          x2={170}
          y2={420}
          stroke='hsl(153 27% 51%)'
          strokeWidth='0.3'
          opacity={0.06 + progress * 0.08}
        />

        {/* ── VOLUMETRIC BODY FILL ── */}
        <path
          d={footPath}
          fill={`url(#body-fill-${uid})`}
          opacity={0.7 + progress * 0.3}
          style={{ transition: 'opacity 0.8s ease-out' }}
        />

        {/* ── INNER VOLUME GLOW ── */}
        <path
          d={footPath}
          fill={`url(#vol-glow-${uid})`}
          opacity={0.8 + progress * 0.2}
          style={{ transition: 'opacity 0.8s ease-out' }}
        />

        {/* ── SCAN SWEEP (volumetric light through foot) ── */}
        {progress > 0 && progress < 1 && (
          <g>
            {/* Wide ambient scan fill */}
            <rect
              x='-20'
              y='-25'
              width='240'
              height='480'
              fill={`url(#scan-beam-${uid})`}
              clipPath={`url(#clip-${uid})`}
              opacity={0.9}
            />
          </g>
        )}

        {/* ── CONTOUR DEPTH LAYERS ── */}
        {contourLayers.map((layer, i) => {
          const tx = 100 * (1 - layer.scale)
          const ty = 210 * (1 - layer.scale) + layer.offsetY
          // Layers reveal progressively with scan
          const revealFactor =
            progress > 0 ? Math.min(1, (scanY - i * 0.08) * 3) : 0
          const layerOpacity =
            progress > 0
              ? layer.opacity * stabilize * Math.max(0.3, revealFactor)
              : layer.opacity * 0.4

          return (
            <path
              key={i}
              d={footPath}
              fill='none'
              stroke='hsl(153 27% 51%)'
              strokeWidth={layer.width + stabilize * 0.2}
              opacity={layerOpacity}
              transform={`translate(${tx}, ${ty}) scale(${layer.scale})`}
              strokeDasharray={
                progress > 0.5 ? 'none' : `${4 + i} ${3 + i * 1.2}`
              }
              strokeLinejoin='round'
              style={{
                transition:
                  'opacity 0.6s ease-out, stroke-dasharray 0.8s ease-out'
              }}
            />
          )
        })}

        {/* ── PRIMARY OUTLINE (elevated, crisp) ── */}
        <path
          d={footPath}
          fill='none'
          stroke='hsl(153 30% 54%)'
          strokeWidth={1.6 + stabilize * 0.6}
          opacity={outerGlow}
          strokeLinejoin='round'
          strokeLinecap='round'
          style={{ transition: 'opacity 0.5s ease-out' }}
        />
        {/* Secondary outer halo stroke */}
        <path
          d={footPath}
          fill='none'
          stroke='hsl(153 27% 51%)'
          strokeWidth={3.5 + stabilize * 1}
          opacity={0.04 + progress * 0.06}
          strokeLinejoin='round'
          style={{
            filter: 'blur(2px)',
            transition: 'opacity 0.6s ease-out'
          }}
        />

        {/* ── ARCH LINE ── */}
        <path
          d={archPath}
          fill='none'
          stroke='hsl(153 27% 51%)'
          strokeWidth={0.5 + stabilize * 0.3}
          opacity={(0.1 + progress * 0.2) * stabilize}
          strokeDasharray={progress > 0.6 ? 'none' : '3 5'}
          style={{ transition: 'opacity 1s ease-out' }}
        />

        {/* ── PRESSURE ZONES (volumetric analysis points) ── */}
        {pressureZones.map((zone, i) => {
          const zoneReveal = Math.max(0, progress - 0.3 - i * 0.05) * 2
          const zonePulse = 1 + pulse * 0.15 * Math.min(1, zoneReveal)

          return (
            <g
              key={i}
              opacity={Math.min(1, zoneReveal)}
              style={{ transition: 'opacity 0.8s ease-out' }}
            >
              {/* Outer ring — expands */}
              <circle
                cx={zone.cx}
                cy={zone.cy}
                r={zone.r * zonePulse}
                fill='none'
                stroke='hsl(153 27% 51%)'
                strokeWidth={0.4}
                opacity={0.3 * stabilize}
                strokeDasharray='2 3'
              />
              {/* Mid ring */}
              <circle
                cx={zone.cx}
                cy={zone.cy}
                r={zone.r * 0.6}
                fill='none'
                stroke='hsl(153 30% 54%)'
                strokeWidth={0.3}
                opacity={0.2 * stabilize}
              />
              {/* Volumetric glow blob */}
              <circle
                cx={zone.cx}
                cy={zone.cy}
                r={zone.r * 0.35}
                fill='hsl(153 27% 51%)'
                opacity={0.15 + progress * 0.15}
                style={{ filter: `blur(${2 + (1 - progress) * 3}px)` }}
              />
              {/* Sharp center dot */}
              <circle
                cx={zone.cx}
                cy={zone.cy}
                r={zone.r * 0.1 + stabilize * 0.5}
                fill='hsl(153 35% 58%)'
                opacity={progress > 0.65 ? (progress - 0.65) * 2 : 0}
                style={{ transition: 'opacity 0.4s ease-out' }}
              />
            </g>
          )
        })}

        {/* ── COMPLETION GLOW ── */}
        <path
          d={footPath}
          fill='hsl(153 30% 54%)'
          opacity={progress > 0.9 ? (progress - 0.9) * 1.5 * 0.1 : 0}
          style={{ transition: 'opacity 0.8s ease-out' }}
        />
      </svg>

      {/* ── HORIZONTAL SCAN BEAM (across viewport) ── */}
      {progress > 0 && progress < 1 && (
        <>
          {/* Core beam line */}
          <div
            className='absolute left-[15%] right-[15%] z-20 pointer-events-none'
            style={{
              top: `${5 + scanY * 90}%`,
              height: '1.5px',
              background: `linear-gradient(90deg, transparent 0%, hsl(153 27% 51% / ${
                0.15 + progress * 0.2
              }) 15%, hsl(153 35% 58% / ${
                0.6 + progress * 0.3
              }) 50%, hsl(153 27% 51% / ${
                0.15 + progress * 0.2
              }) 85%, transparent 100%)`,
              boxShadow: `0 0 10px hsl(153 27% 51% / ${
                0.2 + progress * 0.15
              }), 0 0 30px hsl(153 27% 51% / ${0.08 + progress * 0.08})`
            }}
          />
          {/* Wide diffusion */}
          <div
            className='absolute left-[20%] right-[20%] z-19 pointer-events-none'
            style={{
              top: `${4 + scanY * 90}%`,
              height: '20px',
              background: `linear-gradient(90deg, transparent 0%, hsl(153 27% 51% / ${
                0.02 + progress * 0.03
              }) 25%, hsl(153 27% 51% / ${
                0.05 + progress * 0.05
              }) 50%, hsl(153 27% 51% / ${
                0.02 + progress * 0.03
              }) 75%, transparent 100%)`,
              filter: 'blur(6px)'
            }}
          />
        </>
      )}

      {/* Label */}
      {showLabel && (
        <span
          className='absolute bottom-[3%] kiosk-mono text-xs tracking-[0.3em]'
          style={{
            color: `hsl(153 27% 51% / ${0.3 + progress * 0.4})`,
            transition: 'color 1s ease-out'
          }}
        >
          {side === 'left' ? 'LINKER FUSS' : 'RECHTER FUSS'}
        </span>
      )}
    </div>
  )
}

// Anatomical foot path — toes top, heel bottom (user perspective)
const footPath =
  'M100 8 ' +
  'C88 8 78 12 70 22 C62 32 56 48 52 68 ' +
  'C48 88 44 110 42 135 ' +
  'C40 160 36 185 30 210 ' +
  'C24 240 20 270 22 300 ' +
  'C24 330 30 355 40 372 ' +
  'C50 389 65 398 82 402 ' +
  'C95 405 110 405 122 400 ' +
  'C138 394 150 382 158 365 ' +
  'C164 348 166 325 166 300 ' +
  'C166 275 164 250 162 225 ' +
  'C160 200 158 175 156 150 ' +
  'C154 125 152 100 150 78 ' +
  'C146 52 140 32 132 20 ' +
  'C124 10 112 8 100 8 Z'

const archPath =
  'M42 160 C50 200 60 240 70 270 C80 290 90 300 105 305 ' +
  'C120 300 135 290 145 270 C155 245 160 215 162 185'

export default FootOutline
