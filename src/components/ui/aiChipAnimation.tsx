'use client'

import React, { useMemo } from 'react'

interface CircuitPath {
  d: string
  delay: number
  duration: number
  nodeX: number
  nodeY: number
}

const generateCircuitPaths = (count: number): CircuitPath[] => {
  const paths: CircuitPath[] = []
  const chipCenterX = 400
  const chipCenterY = 200
  const halfW = 60
  const halfH = 40

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const isHorizontal = Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))

    let startX = chipCenterX
    let startY = chipCenterY
    if (isHorizontal) {
      startX += Math.cos(angle) > 0 ? halfW : -halfW
      startY += Math.sin(angle) * halfH * 0.6
    } else {
      startX += Math.cos(angle) * halfW * 0.6
      startY += Math.sin(angle) > 0 ? halfH : -halfH
    }

    const midDist = 80 + Math.random() * 60
    const bendX = startX + Math.cos(angle) * midDist
    const bendY = startY + Math.sin(angle) * midDist

    const endDist = 180 + Math.random() * 100
    const endX = Math.max(20, Math.min(780, chipCenterX + Math.cos(angle) * (halfW + endDist)))
    const endY = Math.max(20, Math.min(380, chipCenterY + Math.sin(angle) * (halfH + endDist)))

    const d = `M ${startX.toFixed(1)} ${startY.toFixed(1)} L ${bendX.toFixed(1)} ${bendY.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}`

    paths.push({
      d,
      delay: i * 0.3 + Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      nodeX: endX,
      nodeY: endY,
    })
  }

  return paths
}

const CHIP_PATHS_COUNT = 24

const AiChipAnimation: React.FC = () => {
  const circuitPaths = useMemo(() => generateCircuitPaths(CHIP_PATHS_COUNT), [])

  return (
    <svg
      viewBox="0 0 800 400"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <radialGradient id="chipBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffdfc0" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ffdfc0" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffdfc0" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ffdfc0" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="800" height="400" fill="url(#chipBg)" />

      {circuitPaths.map((path, i) => (
        <g key={i}>
          <path
            d={path.d}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={path.d}
            fill="none"
            stroke="#ffdfc0"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
            style={{
              strokeDasharray: '8 200',
              strokeDashoffset: '0',
              opacity: 0.8,
              animation: `circuitPulse ${path.duration}s linear ${path.delay}s infinite`,
            }}
          />
          <circle
            cx={path.nodeX}
            cy={path.nodeY}
            r="2"
            fill="#ffdfc0"
            style={{
              opacity: 0,
              animation: `nodeGlow ${path.duration}s linear ${path.delay + path.duration * 0.4}s infinite`,
            }}
          />
        </g>
      ))}

      <rect
        x="340"
        y="160"
        width="120"
        height="80"
        rx="8"
        fill="none"
        stroke="#ffdfc0"
        strokeWidth="1.5"
        strokeOpacity="0.3"
      />
      <rect
        x="344"
        y="164"
        width="112"
        height="72"
        rx="6"
        fill="#222222"
        fillOpacity="0.8"
        stroke="#ffdfc0"
        strokeWidth="0.5"
        strokeOpacity="0.15"
      />

      {Array.from({ length: 8 }).map((_, i) => (
        <React.Fragment key={`pin-t-${i}`}>
          <rect
            x={350 + i * 13}
            y="158"
            width="4"
            height="4"
            fill="#ffdfc0"
            fillOpacity="0.25"
          />
          <rect
            x={350 + i * 13}
            y="238"
            width="4"
            height="4"
            fill="#ffdfc0"
            fillOpacity="0.25"
          />
        </React.Fragment>
      ))}

      <text
        x="400"
        y="208"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffdfc0"
        fillOpacity="0.9"
        fontSize="28"
        fontWeight="700"
        fontFamily="var(--font-inter), Arial, sans-serif"
        letterSpacing="2"
      >
        AI
      </text>

      <circle
        cx="400"
        cy="200"
        r="50"
        fill="none"
        stroke="#ffdfc0"
        strokeWidth="1"
        strokeOpacity="0"
        style={{
          animation: 'centralPulse 4s ease-out infinite',
        }}
      />
      <circle
        cx="400"
        cy="200"
        r="70"
        fill="none"
        stroke="#ffdfc0"
        strokeWidth="0.5"
        strokeOpacity="0"
        style={{
          animation: 'centralPulse 4s ease-out 1.3s infinite',
        }}
      />
    </svg>
  )
}

export default AiChipAnimation
