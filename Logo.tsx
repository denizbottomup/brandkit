/**
 * BottomUP Logo Components
 *
 * Logo image dosyalarına gerek kalmadan her ortamda kullanılabilir
 * kod tabanlı logo implementasyonu.
 *
 * Variants:
 *   <Logo />               → Color wordmark (default, dark bg)
 *   <Logo variant="white" />  → White wordmark (colored bg)
 *   <Logo variant="dark" />   → Dark wordmark (light bg)
 *   <LogoMark />           → Icon only (square mark)
 *   <LogoFull />           → Icon + wordmark side by side
 */

import React from 'react'

/* ─── Brand tokens (mirrored from /brand/tokens.json) ─────── */
const VIOLET = '#7B5CF5'
const COBALT = '#3B5BF5'

/* ─── LogoMark — the square icon ──────────────────────────── */
interface LogoMarkProps {
  size?: number
  className?: string
}

export function LogoMark({ size = 32, className }: LogoMarkProps) {
  const r = size * 0.22  // border-radius as ~22% of size
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="bu-mark-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={COBALT} />
          <stop offset="100%" stopColor={VIOLET} />
        </linearGradient>
      </defs>
      {/* Background square */}
      <rect width="32" height="32" rx={r * (32 / size)} fill="url(#bu-mark-grad)" />
      {/* Stylised "B" / up-arrow mark — white */}
      {/* Vertical stem */}
      <rect x="9" y="8" width="3.5" height="16" rx="1.75" fill="white" />
      {/* Upper bowl */}
      <path
        d="M12.5 8h3.5a4 4 0 0 1 0 8h-3.5V8Z"
        fill="white"
      />
      {/* Lower bowl */}
      <path
        d="M12.5 16h4a4 4 0 0 1 0 8h-4V16Z"
        fill="white"
        opacity="0.85"
      />
      {/* Upward accent tick (momentum) */}
      <path
        d="M20 13.5 L23 10 L23 15"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  )
}

/* ─── Wordmark text ────────────────────────────────────────── */
interface LogoProps {
  variant?: 'color' | 'white' | 'dark'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZE_MAP = {
  sm: { fontSize: '14px', letterSpacing: '-0.01em' },
  md: { fontSize: '18px', letterSpacing: '-0.02em' },
  lg: { fontSize: '24px', letterSpacing: '-0.02em' },
  xl: { fontSize: '32px', letterSpacing: '-0.03em' },
}

const VARIANT_MAP = {
  color: {
    bottom: VIOLET,
    up:     '#FFFFFF',
  },
  white: {
    bottom: '#FFFFFF',
    up:     'rgba(255,255,255,0.75)',
  },
  dark: {
    bottom: '#0B0C14',
    up:     '#3B5BF5',
  },
}

export function Logo({ variant = 'color', size = 'md', className }: LogoProps) {
  const { fontSize, letterSpacing } = SIZE_MAP[size]
  const colors = VARIANT_MAP[variant]

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        fontSize,
        fontWeight: 700,
        letterSpacing,
        fontFamily: "'Satoshi', 'DM Sans', sans-serif",
        userSelect: 'none',
      }}
    >
      <span style={{ color: colors.bottom }}>Bottom</span>
      <span style={{ color: colors.up }}>UP</span>
    </span>
  )
}

/* ─── LogoFull — Mark + Wordmark ──────────────────────────── */
interface LogoFullProps {
  variant?: 'color' | 'white' | 'dark'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  markSize?: number
  className?: string
}

const FULL_SIZE_GAP = { sm: 6, md: 8, lg: 10, xl: 12 }
const FULL_MARK_SIZE = { sm: 20, md: 28, lg: 36, xl: 48 }

export function LogoFull({
  variant = 'color',
  size = 'md',
  markSize,
  className,
}: LogoFullProps) {
  const gap    = FULL_SIZE_GAP[size]
  const mSize  = markSize ?? FULL_MARK_SIZE[size]

  return (
    <div
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap }}
    >
      <LogoMark size={mSize} />
      <Logo variant={variant} size={size} />
    </div>
  )
}

/* ─── LogoWordmarkSVG — Pure SVG string ───────────────────────
 *
 * Satori / OG image / email gibi React render edilemeyen ortamlar için.
 * Doğrudan SVG markup olarak kullanın:
 *
 *   const svg = LogoWordmarkSVG({ variant: 'color', width: 140 })
 *   // → '<svg ...>...</svg>'
 */
export function LogoWordmarkSVG({
  variant = 'color',
  width = 140,
}: {
  variant?: 'color' | 'white' | 'dark'
  width?: number
}): string {
  const colors = VARIANT_MAP[variant]
  const h = Math.round(width * 0.25)
  const fs = Math.round(h * 0.9)

  return `<svg width="${width}" height="${h}" viewBox="0 0 ${width} ${h}" xmlns="http://www.w3.org/2000/svg">
  <text
    x="0" y="${fs}"
    font-family="Satoshi, DM Sans, sans-serif"
    font-weight="700"
    font-size="${fs}"
    letter-spacing="-0.02em"
    fill="${colors.bottom}"
  >Bottom</text>
  <text
    x="${Math.round(width * 0.61)}" y="${fs}"
    font-family="Satoshi, DM Sans, sans-serif"
    font-weight="700"
    font-size="${fs}"
    letter-spacing="-0.02em"
    fill="${colors.up}"
  >UP</text>
</svg>`
}

/* ─── Default export ──────────────────────────────────────── */
export default LogoFull
