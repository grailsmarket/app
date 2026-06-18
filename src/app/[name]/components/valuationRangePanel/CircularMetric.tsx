import React from 'react'

const CircularMetric: React.FC<{ value: string; label: string; fillPercent: number }> = ({
  value,
  label,
  fillPercent,
}) => {
  const size = 72
  const stroke = 6
  const safeFill = Math.max(0, Math.min(fillPercent, 100))
  // Like the google metrics bars: the colour at the fill edge tracks the value —
  // grey at low fill, blending toward (glowing) primary as it grows.
  const fillOpacity = 0.72 + (safeFill / 100) * 0.28
  const edgeColor = `color-mix(in srgb, var(--color-primary) ${safeFill.toFixed(0)}%, var(--color-neutral))`
  const glow = (safeFill / 100) * 6
  // donut mask: keep only the outer ring of thickness `stroke`
  const ringMask = `radial-gradient(farthest-side, transparent calc(100% - ${stroke}px), #000 calc(100% - ${stroke}px))`

  return (
    <div className='flex flex-col items-center gap-2'>
      <div className='relative' style={{ width: size, height: size }}>
        {/* track */}
        <div
          className='absolute inset-0 rounded-full'
          style={{ background: 'var(--color-neutral)', opacity: 0.25, mask: ringMask, WebkitMask: ringMask }}
        />
        {/* progress arc — grey start, brightening toward the fill edge, then transparent */}
        <div
          className='absolute inset-0 rounded-full transition-all duration-500'
          style={{
            background: `conic-gradient(from 0deg, var(--color-neutral) 0%, ${edgeColor} ${safeFill.toFixed(1)}%, transparent ${safeFill.toFixed(1)}%)`,
            opacity: fillOpacity,
            filter: glow > 0.2 ? `drop-shadow(0 0 ${glow.toFixed(1)}px var(--color-primary))` : undefined,
            mask: ringMask,
            WebkitMask: ringMask,
          }}
        />
        <div className='absolute inset-0 flex items-center justify-center'>
          <span className='text-lg font-semibold'>{value}</span>
        </div>
      </div>
      <span className='text-neutral text-center text-lg font-medium'>{label}</span>
    </div>
  )
}

export default CircularMetric
