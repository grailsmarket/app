import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { NextRequest, NextResponse } from 'next/server'
import { beautifyName } from '@/lib/ens'
import { toSteppedPercent } from '@/utils/metrics'
import { getEtherPrice } from '@/utils/web3/getEtherPrice'
import { computeAxisMax, heatBellSamples, niceStep, OUTLIER_MULT } from '@/utils/valuation/plotMath'
import { API_URL } from '@/constants/api'
import type { ValuationEvidenceResult } from '@/types/valuation'
import { getInterFonts } from '../_lib/inter'

// Portrait canvas — this image is only used by the manual share modal (download /
// copy / native share), not as a link-unfurl OG card, so we mirror the panel's
// own portrait proportions instead of a 1.91:1 social ratio.
const size = {
  width: 1200,
  height: 1350,
}

// Palette (hardcoded — Satori can't read the app's global CSS variables).
const PRIMARY = '#ffdfc0'
const PRIMARY_RGB = '255,223,192'
const NEUTRAL_RGB = '170,170,170'
const FOREGROUND = '#f4f4f4'
const NEUTRAL = '#aaaaaa'
const CARD_BG = '#333333'
const CARD_BORDER = '#444444'
const PILL_BG = '#3c3c3c'
const TRACK_BG = 'rgba(255,255,255,0.10)'

const CARD_WIDTH = 1080
const CARD_PADDING = 40
const CONTENT_WIDTH = CARD_WIDTH - CARD_PADDING * 2 // 1000
const BAR_HEIGHT = 56

const MAX_PILLS = 12

const DISCLAIMER =
  'Valuations are AI-generated estimates for informational purposes only and may be inaccurate. Not financial advice.'

let cachedLogo: string | null = null
async function getLogoDataUri(): Promise<string | null> {
  if (cachedLogo) return cachedLogo
  try {
    const svg = await readFile(join(process.cwd(), 'public/logo-w-text.svg'))
    cachedLogo = `data:image/svg+xml;base64,${svg.toString('base64')}`
    return cachedLogo
  } catch (error) {
    console.error('Error reading logo:', error)
    return null
  }
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString('en-US')
}

function formatEth(value: number): string {
  return `${value.toLocaleString('en-US', {
    maximumFractionDigits: value < 0.01 ? 6 : value < 1 ? 4 : 3,
  })} ETH`
}

function formatEthShort(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: value < 1 ? 3 : value < 10 ? 2 : 1 })
}

function formatUsd(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`
}

/** Compact search-volume formatting: 1k, 10k, 100k, 1mil, 1.2mil. */
function formatSearchCount(value: number): string {
  const trim = (n: number) => Number(n.toFixed(1)).toLocaleString('en-US')
  if (value >= 1_000_000) return `${trim(value / 1_000_000)}mil`
  if (value >= 1_000) return `${trim(value / 1_000)}k`
  return value.toLocaleString('en-US')
}

/** Interpolate neutral grey -> primary as the metric fills (replaces color-mix). */
function edgeColor(fill: number): string {
  const t = Math.max(0, Math.min(1, fill))
  const r = Math.round(170 + (255 - 170) * t)
  const g = Math.round(170 + (223 - 170) * t)
  const b = Math.round(170 + (192 - 170) * t)
  return `rgb(${r},${g},${b})`
}

/** Heat gradient for Satori: maps the shared bell samples to rgba stops (no color-mix). */
function buildHeatGradient(lowFrac: number, estFrac: number, highFrac: number): string {
  const pct = (f: number) => (f * 100).toFixed(2)
  const samples = heatBellSamples(lowFrac, estFrac, highFrac)
  const stops = [
    'transparent 0%',
    `transparent ${pct(lowFrac)}%`,
    ...samples.map((s) => `rgba(${PRIMARY_RGB},${(s.opacity * 0.92).toFixed(3)}) ${pct(s.frac)}%`),
    `transparent ${pct(highFrac)}%`,
    'transparent 100%',
  ]
  return `linear-gradient(to right, ${stops.join(', ')})`
}

type CompSale = { name: string; priceEth: number }
type CompGroup = { name: string; count: number; minPrice: number }

function ScenarioRow({
  low,
  estimate,
  high,
  ethPrice,
}: {
  low: number
  estimate: number
  high: number
  ethPrice: number
}) {
  const items = [
    { key: 'low', label: 'Low', eth: low, center: 0.125, primary: false },
    { key: 'est', label: 'Estimate', eth: estimate, center: 0.5, primary: true },
    { key: 'high', label: 'High', eth: high, center: 0.875, primary: false },
  ]
  const W = CONTENT_WIDTH
  const itemW = 280
  const lineTop = 131

  return (
    <div style={{ position: 'relative', display: 'flex', width: W, height: 150 }}>
      {/* connecting line: low -> est (brighter), est -> high (softer) */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          left: W * 0.125,
          width: W * 0.375,
          top: lineTop,
          height: 3,
          backgroundColor: `rgba(${PRIMARY_RGB},0.5)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          left: W * 0.5,
          width: W * 0.375,
          top: lineTop,
          height: 3,
          backgroundColor: `rgba(${PRIMARY_RGB},0.25)`,
        }}
      />
      {items.map((it) => (
        <div
          key={it.key}
          style={{
            position: 'absolute',
            left: it.center * W - itemW / 2,
            top: 0,
            width: itemW,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', height: 28, alignItems: 'flex-end', justifyContent: 'center' }}>
            {ethPrice > 0 && <span style={{ fontSize: 24, color: NEUTRAL }}>{formatUsd(it.eth * ethPrice)}</span>}
          </div>
          <div style={{ display: 'flex', height: 62, alignItems: 'flex-end', justifyContent: 'center' }}>
            <span
              style={{
                fontSize: it.primary ? 56 : 40,
                fontWeight: 700,
                color: it.primary ? FOREGROUND : NEUTRAL,
                lineHeight: 1,
              }}
            >
              {formatEth(it.eth)}
            </span>
          </div>
          <div style={{ display: 'flex', height: 28, alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 24, color: NEUTRAL }}>{it.label}</span>
          </div>
          <div style={{ display: 'flex', height: 26, alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                display: 'flex',
                width: it.primary ? 20 : 14,
                height: it.primary ? 20 : 14,
                borderRadius: 20,
                backgroundColor: PRIMARY,
                ...(it.primary ? { boxShadow: `0 0 14px rgba(${PRIMARY_RGB},0.6)` } : {}),
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function ValuationBar({
  low,
  estimate,
  high,
  axisMax,
  comps,
}: {
  low: number
  estimate: number
  high: number
  axisMax: number
  comps: CompSale[]
}) {
  const W = CONTENT_WIDTH
  const toFrac = (price: number) => Math.max(0, Math.min(1, price / axisMax))
  const xPct = (price: number) => toFrac(price) * 100
  const heatGradient = buildHeatGradient(toFrac(low), toFrac(estimate), toFrac(high))

  const tickStep = niceStep(axisMax / 5)
  const ticks = Array.from({ length: Math.floor(axisMax / tickStep + 1e-9) + 1 }, (_, i) => i * tickStep)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: W }}>
      <div style={{ position: 'relative', display: 'flex', width: W, height: BAR_HEIGHT }}>
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            left: 0,
            top: 0,
            width: W,
            height: BAR_HEIGHT,
            borderRadius: 12,
            backgroundColor: TRACK_BG,
          }}
        />
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            left: 0,
            top: 0,
            width: W,
            height: BAR_HEIGHT,
            borderRadius: 12,
            background: heatGradient,
          }}
        />
        {comps.map((comp, i) => {
          const isOutlier = comp.priceEth > high * OUTLIER_MULT
          const left = isOutlier ? W - 5 : (xPct(comp.priceEth) / 100) * W
          return (
            <div
              key={`comp-${i}`}
              style={{
                position: 'absolute',
                display: 'flex',
                left: left - 0.5,
                top: 0,
                width: 1,
                height: BAR_HEIGHT,
                backgroundColor: isOutlier ? `rgba(${PRIMARY_RGB},0.45)` : 'rgba(255,255,255,0.45)',
              }}
            />
          )
        })}
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            left: (xPct(estimate) / 100) * W - 1,
            top: 0,
            width: 2,
            height: BAR_HEIGHT,
            backgroundColor: PRIMARY,
            boxShadow: `0 0 12px rgba(${PRIMARY_RGB},0.7)`,
          }}
        />
      </div>
      <div style={{ position: 'relative', display: 'flex', width: W, height: 30, marginTop: 6 }}>
        {ticks.map((tick, i) => (
          <div
            key={`tick-${i}`}
            style={{
              position: 'absolute',
              display: 'flex',
              left: i === 0 ? 0 : (xPct(tick) / 100) * W - 40,
              top: 0,
              width: 80,
              justifyContent: i === 0 ? 'flex-start' : 'center',
            }}
          >
            <span style={{ fontSize: 24, color: NEUTRAL }}>{tick === 0 ? '0' : formatEthShort(tick)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CircularMetric({ value, label, fillPercent }: { value: string; label: string; fillPercent: number }) {
  const dim = 144
  const stroke = 11
  const glowWidth = 9
  // Pull the radius in so the glow halo (a wider arc) stays inside the SVG bounds
  // and isn't clipped at the top/sides.
  const r = (dim - stroke) / 2 - (glowWidth / 2 + 3)
  const cx = dim / 2
  const cy = dim / 2
  const circumference = 2 * Math.PI * r
  const fill = Math.max(0, Math.min(100, fillPercent)) / 100
  const dashOffset = circumference * (1 - fill)
  const color = edgeColor(fill)
  const glowOpacity = fill > 0.05 ? Math.min(0.45, fill * 0.5) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: 230 }}>
      <div style={{ position: 'relative', display: 'flex', width: dim, height: dim }}>
        <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
          <circle cx={cx} cy={cy} r={r} fill='none' stroke={`rgba(${NEUTRAL_RGB},0.25)`} strokeWidth={stroke} />
          {glowOpacity > 0 && (
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill='none'
              stroke={PRIMARY}
              strokeWidth={stroke + glowWidth}
              strokeOpacity={glowOpacity}
              strokeLinecap='round'
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          )}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill='none'
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap='round'
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: dim,
            height: dim,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 30, fontWeight: 600, color: FOREGROUND }}>{value}</span>
        </div>
      </div>
      <div style={{ display: 'flex', width: 210, justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: 22, color: NEUTRAL, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
      </div>
    </div>
  )
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const name = searchParams.get('name')

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Returns null ONLY for a definitive "no valuation": not generated yet (401),
    // feature disabled (404) or an ineligible name (400). A transient backend
    // failure throws, so we can answer 502 instead of a misleading "no valuation" 404.
    const getValuation = async (): Promise<ValuationEvidenceResult | null> => {
      const res = await fetch(`${API_URL}/valuations/${encodeURIComponent(name)}/evidence`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      })
      if (res.status === 401 || res.status === 404 || res.status === 400) return null
      if (!res.ok) throw new Error(`valuation backend responded ${res.status}`)
      const json = (await res.json().catch(() => null)) as {
        success?: boolean
        data?: ValuationEvidenceResult
      } | null
      if (!json?.success || !json.data) return null
      return json.data
    }

    // Only generate an image for names that already have a valuation. This is an
    // unauthenticated cache "peek" (never triggers a generation); when no cached
    // valuation exists we 404 rather than render a placeholder image. A transient
    // upstream failure answers 502 so a backend hiccup isn't cached as a 404.
    let valuation: ValuationEvidenceResult | null
    try {
      valuation = await getValuation()
    } catch (error) {
      console.error('Error fetching valuation evidence:', error)
      return NextResponse.json({ error: 'Valuation is temporarily unavailable' }, { status: 502 })
    }
    const appraisal = valuation?.evidence.appraisal
    const low = toNumber(appraisal?.lowEth)
    const estimate = toNumber(appraisal?.ethValue)
    const high = toNumber(appraisal?.highEth)
    const hasValuation = appraisal != null && low !== null && estimate !== null && high !== null

    if (!hasValuation) {
      return NextResponse.json({ error: 'No valuation available for this name' }, { status: 404 })
    }

    const [ethPriceRaw, logoDataUri, interFonts] = await Promise.all([
      getEtherPrice(true).catch(() => null),
      getLogoDataUri(),
      getInterFonts(),
    ])

    const ethPrice = ethPriceRaw && ethPriceRaw > 0 ? ethPriceRaw : 0
    const beautified = beautifyName(name)

    const header = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: CONTENT_WIDTH,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 40, fontWeight: 700, color: FOREGROUND }}>Valuation</span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.8)',
              color: '#222222',
              fontSize: 18,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1,
              padding: '4px 10px',
              borderRadius: 6,
            }}
          >
            beta
          </div>
        </div>
        <span style={{ fontSize: 26, color: NEUTRAL }}>✨ GrailsAI</span>
      </div>
    )

    const footer = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginTop: 4 }}>
        {logoDataUri && <img src={logoDataUri} alt='Grails' width={250} height={77} />}
        <span style={{ fontSize: 30, color: PRIMARY }}>{`grails.app/${beautified}`}</span>
      </div>
    )

    const comps: CompSale[] = (appraisal!.compsUsed ?? [])
      .map((comp) => ({ name: comp.name, priceEth: toNumber(comp.priceEth) ?? 0 }))
      .filter((comp) => comp.priceEth > 0)

    const maxNonOutlier = comps.reduce(
      (max, comp) => (comp.priceEth <= high! * OUTLIER_MULT ? Math.max(max, comp.priceEth) : max),
      0
    )
    const axisMax = computeAxisMax(high!, maxNonOutlier)

    const groupMap = new Map<string, CompGroup>()
    for (const comp of comps) {
      const existing = groupMap.get(comp.name)
      if (existing) {
        existing.count += 1
        existing.minPrice = Math.min(existing.minPrice, comp.priceEth)
      } else {
        groupMap.set(comp.name, { name: comp.name, count: 1, minPrice: comp.priceEth })
      }
    }
    const groups = Array.from(groupMap.values()).sort((a, b) => a.minPrice - b.minPrice)
    const visibleGroups = groups.slice(0, MAX_PILLS)
    const hiddenGroupCount = groups.length - visibleGroups.length

    const evidence = valuation!.evidence
    const web2Count = evidence.web2?.summary?.registeredExtensions
    const avgSearches = evidence.searchDemand?.summary?.avgMonthlySearches
    const meaningsCount = evidence.nameResearch?.senses?.length
    const salesAnalysed = evidence.marketActivity?.salesFound

    return new ImageResponse(
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle, #444444, #222222)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
          padding: 48,
          fontFamily: 'Inter, sans-serif',
          color: FOREGROUND,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: CARD_WIDTH,
            padding: CARD_PADDING,
            gap: 26,
            borderRadius: 20,
            border: `2px solid ${CARD_BORDER}`,
            backgroundColor: CARD_BG,
          }}
        >
          {header}

          <div style={{ display: 'flex', width: CONTENT_WIDTH, justifyContent: 'center' }}>
            <span
              style={{
                fontSize: 52,
                fontWeight: 700,
                maxWidth: CONTENT_WIDTH,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {beautified}
            </span>
          </div>

          <ScenarioRow low={low!} estimate={estimate!} high={high!} ethPrice={ethPrice} />

          <ValuationBar low={low!} estimate={estimate!} high={high!} axisMax={axisMax} comps={comps} />

          {visibleGroups.length > 0 && (
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: CONTENT_WIDTH }}
            >
              <span style={{ fontSize: 26, fontWeight: 600, color: NEUTRAL }}>Similar Sales</span>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: 10,
                  width: CONTENT_WIDTH,
                }}
              >
                {visibleGroups.map((group) => (
                  <div
                    key={group.name}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: PILL_BG,
                      border: '1px solid #555555',
                      borderRadius: 8,
                      padding: '6px 14px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 26,
                        color: FOREGROUND,
                        maxWidth: 240,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {group.name}
                    </span>
                    {group.count > 1 && <span style={{ fontSize: 26, color: NEUTRAL }}>{`×${group.count}`}</span>}
                  </div>
                ))}
                {hiddenGroupCount > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: PILL_BG,
                      border: '1px solid #555555',
                      borderRadius: 8,
                      padding: '6px 14px',
                    }}
                  >
                    <span style={{ fontSize: 26, color: NEUTRAL }}>{`+${hiddenGroupCount} more`}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* supporting signals — circular rings, mirroring the panel */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: CONTENT_WIDTH,
              marginTop: 4,
            }}
          >
            <CircularMetric
              value={web2Count != null ? formatNumber(web2Count) : 'N/A'}
              label='Web2 TLDs registered'
              fillPercent={toSteppedPercent(web2Count ?? 0, 500)}
            />
            <CircularMetric
              value={avgSearches != null ? formatSearchCount(avgSearches) : 'N/A'}
              label='Avg monthly searches'
              fillPercent={toSteppedPercent(avgSearches ?? 0, 1_000_000)}
            />
            <CircularMetric
              value={meaningsCount != null ? formatNumber(meaningsCount) : 'N/A'}
              label='Meanings'
              fillPercent={toSteppedPercent(meaningsCount ?? 0, 10)}
            />
            <CircularMetric
              value={salesAnalysed != null ? formatNumber(salesAnalysed) : 'N/A'}
              label='Sales analysed'
              fillPercent={toSteppedPercent(salesAnalysed ?? 0, 200)}
            />
          </div>

          <div
            style={{
              display: 'flex',
              width: CONTENT_WIDTH,
              borderTop: `1px solid ${CARD_BORDER}`,
              paddingTop: 18,
              marginTop: 4,
            }}
          >
            <span style={{ fontSize: 22, color: NEUTRAL, lineHeight: 1.3 }}>{DISCLAIMER}</span>
          </div>
        </div>

        {footer}
      </div>,
      {
        ...size,
        emoji: 'twemoji',
        fonts: interFonts,
        headers: {
          'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
        },
      }
    )
  } catch (error) {
    console.error('Error generating valuation image:', error)
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}
