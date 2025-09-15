'use client'

import * as React from 'react'
import SpectreWeaveLogo from './SpectreWeaveLogo'

interface LogoLoaderProps {
  message?: string
  size?: number // diameter of the spinner in px
  speedMs?: number // rotation duration
  trackOpacity?: number
  accentColor?: string
}

export default function LogoLoader({
  message,
  size = 96,
  speedMs = 1100,
  trackOpacity = 0.35,
  accentColor,
}: LogoLoaderProps) {
  const spinnerSize = Math.max(64, size)
  const ringWidth = Math.max(4, Math.floor(spinnerSize / 24))

  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefersReducedMotion(media.matches)
    update()
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])

  const dotSize = Math.max(6, Math.round(ringWidth * 1.6))
  const dotColor = accentColor ?? 'rgb(180 159 255)'

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 select-none" role="status" aria-busy>
      <div className="relative" style={{ width: spinnerSize, height: spinnerSize }}>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            borderStyle: 'solid',
            borderWidth: `${ringWidth}px`,
            borderColor: 'var(--border)',
            opacity: trackOpacity,
          }}
        />

        <div
          className={['absolute inset-0 rounded-full', prefersReducedMotion ? '' : 'animate-spin'].join(' ')}
          style={{ animationDuration: `${speedMs}ms` }}
        >
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{
              top: 0,
              width: `${dotSize}px`,
              height: `${dotSize}px`,
              background: dotColor,
              boxShadow: `0 0 ${Math.ceil(dotSize * 1.5)}px ${dotColor}`,
            }}
          />
        </div>

        <div className="absolute inset-0 grid place-items-center">
          <div className="rounded-full p-2 bg-transparent">
            <SpectreWeaveLogo size="lg" showText={false} bordered={false} />
          </div>
        </div>
      </div>

      
    </div>
  )
}

