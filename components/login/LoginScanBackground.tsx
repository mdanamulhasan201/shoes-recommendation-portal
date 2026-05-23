'use client'

import { useMemo } from 'react'

const VARIANT_COUNT = 3

const stroke = 'currentColor'
const sw = 1.25

/** One-line SVG scenes: foot on scanner bed + moving scan beam (random variant per visit). */
export function LoginScanBackground () {
  const variant = useMemo(
    () => Math.floor(Math.random() * VARIANT_COUNT),
    []
  )

  return (
    <div
      className='pointer-events-none absolute inset-0 text-emerald-400/25'
      aria-hidden
    >
      <div className='absolute inset-0 bg-[#121816]' />
      <div className='absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_30%_20%,hsl(153_45%_35%/0.28),transparent_60%)]' />
      <div className='absolute inset-0 bg-[radial-gradient(ellipse_55%_70%_at_75%_45%,hsl(153_31%_51%/0.18),transparent_55%)]' />
      <div className='absolute inset-0 bg-[radial-gradient(ellipse_40%_50%_at_50%_100%,rgba(255,255,255,0.04),transparent_50%)]' />

      <svg
        className='absolute inset-0 h-full w-full opacity-[0.5] lg:translate-x-[-6%] lg:scale-[1.02]'
        viewBox='0 0 1200 800'
        preserveAspectRatio='xMidYMid slice'
        fill='none'
      >
        <defs>
          <pattern id='login-grid' width='48' height='48' patternUnits='userSpaceOnUse'>
            <path
              d='M48 0H0V48'
              stroke='rgba(255,255,255,0.04)'
              strokeWidth='1'
            />
          </pattern>
        </defs>
        <rect width='1200' height='800' fill='url(#login-grid)' />

        {variant === 0 ? <VariantFootSoleScan /> : null}
        {variant === 1 ? <VariantProfileScanner /> : null}
        {variant === 2 ? <VariantDualFeetGrid /> : null}
      </svg>

      <div className='login-scan-beam absolute left-[8%] right-[8%] top-[18%] h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent' />
    </div>
  )
}

function VariantFootSoleScan () {
  return (
    <g transform='translate(280 120) scale(1.05)'>
      <path
        d='M320 420 C320 280 380 200 480 180 C560 165 620 200 640 260 C655 310 640 380 600 430 C560 490 480 520 400 500 C340 485 320 460 320 420 Z'
        stroke={stroke}
        strokeWidth={sw * 1.2}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M400 200 C420 175 455 165 490 175 C520 184 545 210 555 245'
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap='round'
        opacity='0.7'
      />
      <path
        d='M455 175 C470 160 500 155 530 165 C555 173 575 195 585 225'
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap='round'
        opacity='0.5'
      />
      <rect
        x='240'
        y='480'
        width='440'
        height='120'
        rx='24'
        stroke={stroke}
        strokeWidth={sw}
        opacity='0.35'
      />
      <path d='M260 500 H660 M260 540 H660 M260 580 H660' stroke='rgba(255,255,255,0.08)' strokeWidth='1' />
      <path
        d='M220 460 L220 620 M700 460 L700 620 M220 460 L700 460 M220 620 L700 620'
        stroke={stroke}
        strokeWidth={sw * 0.9}
        strokeLinecap='round'
        opacity='0.4'
      />
      <circle cx='480' cy='300' r='140' stroke={stroke} strokeWidth='0.75' opacity='0.2' strokeDasharray='8 12' />
      <text
        x='480'
        y='640'
        textAnchor='middle'
        fill='rgba(255,255,255,0.12)'
        fontSize='14'
        fontFamily='system-ui,sans-serif'
        letterSpacing='0.35em'
      >
        FUSSSCAN
      </text>
    </g>
  )
}

function VariantProfileScanner () {
  return (
    <g transform='translate(120 80)'>
      <path
        d='M520 520 L520 380 C520 300 560 240 620 220 C680 200 740 230 760 290 L780 360'
        stroke={stroke}
        strokeWidth={sw * 1.1}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M760 290 C780 320 790 360 785 400 C780 440 760 470 720 490 L520 520'
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap='round'
        strokeLinejoin='round'
        opacity='0.85'
      />
      <path
        d='M600 220 C620 180 660 155 710 160 C760 165 800 200 820 250'
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap='round'
        opacity='0.6'
      />
      <path
        d='M480 540 L880 540 L900 580 L460 580 Z'
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin='round'
        opacity='0.45'
      />
      <path d='M500 560 H860' stroke='rgba(52,211,153,0.25)' strokeWidth='2' strokeDasharray='6 10' />
      <path
        d='M440 200 L440 640 M920 200 L920 640'
        stroke={stroke}
        strokeWidth={sw * 0.8}
        opacity='0.25'
        strokeLinecap='round'
      />
      <path
        d='M440 200 L920 200 M440 400 L920 400 M440 640 L920 640'
        stroke={stroke}
        strokeWidth='0.6'
        opacity='0.15'
      />
    </g>
  )
}

function VariantDualFeetGrid () {
  return (
    <g transform='translate(100 100)'>
      <path
        d='M280 380 C280 260 340 200 400 190 C460 180 510 230 520 300 C528 360 500 420 450 450 C400 480 330 470 300 430 C285 410 280 395 280 380 Z'
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M620 380 C620 260 680 200 740 190 C800 180 850 230 860 300 C868 360 840 420 790 450 C740 480 670 470 640 430 C625 410 620 395 620 380 Z'
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap='round'
        strokeLinejoin='round'
        opacity='0.85'
      />
      <path
        d='M200 500 H900'
        stroke={stroke}
        strokeWidth={sw * 1.2}
        strokeLinecap='round'
        opacity='0.35'
      />
      <path
        d='M200 500 C350 480 550 520 700 500 S950 490 1000 500'
        stroke='rgba(52,211,153,0.35)'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeDasharray='4 8'
      />
      <rect x='180' y='520' width='840' height='80' rx='16' stroke={stroke} strokeWidth={sw} opacity='0.3' />
      {[0, 1, 2, 3, 4].map(i => (
        <line
          key={i}
          x1={220 + i * 160}
          y1='520'
          x2={220 + i * 160}
          y2='600'
          stroke='rgba(255,255,255,0.06)'
          strokeWidth='1'
        />
      ))}
    </g>
  )
}
