'use client'

import React, { useMemo } from 'react'

interface Trace {
  d: string
  delay: number
  duration: number
  endX: number
  endY: number
}

const generateTraces = (): Trace[] => {
  const traces: Trace[] = []
  const cx = 600
  const cy = 200
  const half = 50
  const chipLeft = cx - half
  const chipRight = cx + half
  const chipTop = cy - half
  const chipBottom = cy + half

  const addTopTraces = () => {
    const count = 14
    for (let i = 0; i < count; i++) {
      const startX = chipLeft + ((i + 0.5) / count) * (half * 2)
      const startY = chipTop
      const up = 20 + Math.random() * 30
      const endX = startX
      const endY = startY - up - 30
      const d = `M ${startX.toFixed(1)} ${startY.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}`
      traces.push({ d, delay: i * 0.12, duration: 1.8 + Math.random() * 1.4, endX, endY })
    }
  }

  const addBottomTraces = () => {
    const count = 14
    for (let i = 0; i < count; i++) {
      const startX = chipLeft + ((i + 0.5) / count) * (half * 2)
      const startY = chipBottom
      const down = 20 + Math.random() * 30
      const endX = startX
      const endY = startY + down + 30
      const d = `M ${startX.toFixed(1)} ${startY.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}`
      traces.push({ d, delay: i * 0.12 + 0.5, duration: 1.8 + Math.random() * 1.4, endX, endY })
    }
  }

  const addLeftTraces = () => {
    const count = 14
    for (let i = 0; i < count; i++) {
      const startX = chipLeft
      const startY = chipTop + ((i + 0.5) / count) * (half * 2)
      const isUpper = startY < cy
      const left1 = 20 + ((isUpper ? i % 7 : 7 - (i % 7)) / 7) * 60
      const diagonalDir = isUpper ? -1 : 1
      const diagonalLen = 6 + 0.3 * 10
      const left2 = 20 + Math.random() * 50

      const mid1X = startX - left1
      const mid1Y = startY
      const mid2X = mid1X - 8
      const mid2Y = mid1Y + diagonalDir * diagonalLen
      const endX = mid2X - left2
      const endY = mid2Y

      const d = `M ${startX.toFixed(1)} ${startY.toFixed(1)} L ${mid1X.toFixed(1)} ${mid1Y.toFixed(1)} L ${mid2X.toFixed(1)} ${mid2Y.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}`
      traces.push({ d, delay: i * 0.14 + 1.0, duration: 1.8 + Math.random() * 1.4, endX, endY })
    }
  }

  const addRightTraces = () => {
    const count = 14
    for (let i = 0; i < count; i++) {
      const startX = chipRight
      const startY = chipTop + ((i + 0.5) / count) * (half * 2)
      const right = 20 + Math.random() * 30
      const endX = startX + right
      const endY = startY
      const d = `M ${startX.toFixed(1)} ${startY.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}`
      traces.push({ d, delay: i * 0.14 + 1.5, duration: 1.8 + Math.random() * 1.4, endX, endY })
    }
  }

  addTopTraces()
  addBottomTraces()
  addLeftTraces()
  addRightTraces()

  return traces
}

const AiChipAnimation: React.FC = () => {
  const traces = useMemo(() => generateTraces(), [])
  const cx = 600
  const cy = 200
  const half = 50

  return (
    <svg
      viewBox='0 0 660 400'
      className='h-fit w-[1400px] -translate-y-[30%]'
      preserveAspectRatio='xMaxYMid meet'
      aria-hidden='true'
    >
      <defs>
        <filter id='glow' x='-50%' y='-50%' width='200%' height='200%'>
          <feGaussianBlur stdDeviation='2.5' result='blur' />
          <feMerge>
            <feMergeNode in='blur' />
            <feMergeNode in='SourceGraphic' />
          </feMerge>
        </filter>

        <radialGradient id='chipBg' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stopColor='#ffdfc0' stopOpacity='0.06' />
          <stop offset='100%' stopColor='#ffdfc0' stopOpacity='0' />
        </radialGradient>
      </defs>

      <rect x='0' y='0' width='800' fill='url(#chipBg)' />

      {traces.map((trace, i) => (
        <g key={i}>
          <path
            d={trace.d}
            fill='none'
            stroke='#ffdfc0'
            strokeWidth='0.8'
            strokeOpacity='0.12'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path
            d={trace.d}
            fill='none'
            stroke='#ffdfc0'
            strokeWidth='1.2'
            strokeLinecap='round'
            strokeLinejoin='round'
            filter='url(#glow)'
            style={{
              strokeDasharray: '6 180',
              strokeDashoffset: '0',
              opacity: 0.7,
              animation: `circuitPulse ${trace.duration}s linear ${trace.delay}s infinite`,
            }}
          />
        </g>
      ))}

      <rect
        x={cx - half}
        y={cy - half}
        width={half * 2}
        height={half * 2}
        fill='#222222'
        fillOpacity='0.85'
        stroke='#ffdfc0'
        strokeWidth='1.5'
        strokeOpacity='0.35'
        rx='5'
      />

      <text
        x={cx}
        y={cy + 2}
        textAnchor='middle'
        dominantBaseline='middle'
        fill='#ffdfc0'
        fillOpacity='0.95'
        fontSize='26'
        fontWeight='700'
        fontFamily='var(--font-inter), Arial, sans-serif'
        letterSpacing='2'
      >
        AI
      </text>
    </svg>
  )
}

export default AiChipAnimation
