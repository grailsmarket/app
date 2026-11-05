import { GRACE_PERIOD, PREMIUM, UNREGISTERED } from '@/constants/domains/registrationStatuses'
import { RegistrationStatus } from '@/types/domains'

// The metadata service renders normalized names with version-specific default
// artwork so its output is a pure function of `(name, avatar, records)`
// and can be cached for a year. State-driven coloring is applied here at
// render time because expiry transitions are time-driven, not event-driven,
// and the server has no way to know which state a cached image should be in.
//
// Non-normalized names use `paint1` (red) + warning badge on the server,
// which we intentionally leave untouched: normalization status is not
// time-dependent.
//
// V1 avatar images omit `paint0`. V2 marks its background as `avatar` or
// `weave`, and only weave backgrounds opt into the semantic paints below.
// This keeps avatars unchanged and avoids recoloring embedded SVG images.

type GradientStops = { from: string; mid: string; to: string }
type V2Palette = { accent: string; card: string; weave: string }

// Match the gradients we previously shipped in the metadata service (PR #6
// `feat(image): soften expired/grace/premium gradients to 2-stop mid→dark`).
// REGISTERED intentionally absent — keep the server's default blue paint0.
const STATE_GRADIENTS: Partial<Record<RegistrationStatus, GradientStops>> = {
  [GRACE_PERIOD]: { from: '#a17701', mid: '#CC9500', to: '#E4BA3D' },
  [PREMIUM]: { from: '#3AAF8A', mid: '#2AAF63', to: '#2AAF2A' },
  [UNREGISTERED]: { from: '#4460A7', mid: '#1B6E9B', to: 'rgb(39 161 214)' },
}

// Official ENS V2 lapis, peridot and citrine palettes. Registered names keep
// the metadata service's neutral monochrome weave.
const V2_STATE_PALETTES: Partial<Record<RegistrationStatus, V2Palette>> = {
  [GRACE_PERIOD]: { accent: '#CF8700', card: '#FCFCF2', weave: '#EDAB39' },
  [PREMIUM]: { accent: '#1B871B', card: '#E8F6EF', weave: '#2AAF2A' },
  [UNREGISTERED]: { accent: '#0277AB', card: '#F6FBFD', weave: '#61CCFA' },
}

const PAINT0_PATTERN = /<linearGradient id="paint0_linear"[^>]*>[\s\S]*?<\/linearGradient>/
const V2_PAINT_PATTERN =
  /(<linearGradient\b[^>]*\bid="ens-v2-(card|accent|weave-primary|weave-secondary)"[^>]*>)([\s\S]*?)(<\/linearGradient>)/g

const lightenWeave = (color: string) =>
  `#${color
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) =>
      Math.round((parseInt(channel, 16) + 255) / 2)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`

export function applyStateGradient(svg: string, status: RegistrationStatus): string {
  const root = svg.match(/<svg\b[^>]*>/)?.[0]
  if (root?.includes('data-ens-version="2"')) {
    const palette = V2_STATE_PALETTES[status]
    if (!palette || !root.includes('data-ens-v2-background="weave"')) return svg

    const paints: Record<string, string> = {
      card: palette.card,
      accent: palette.accent,
      'weave-primary': palette.weave,
      'weave-secondary': lightenWeave(palette.weave),
    }
    return svg.replace(
      V2_PAINT_PATTERN,
      (_match, opening: string, paint: string, stops: string, closing: string) =>
        opening + stops.replace(/stop-color="[^"]*"/g, `stop-color="${paints[paint]}"`) + closing
    )
  }

  const stops = STATE_GRADIENTS[status]
  if (!stops) return svg
  const replacement = `<linearGradient id="paint0_linear" x1="0" y1="0" x2="269.553" y2="285.527" gradientUnits="userSpaceOnUse"><stop stop-color="${stops.from}"/><stop offset="0.25" stop-color="${stops.mid}"/><stop offset="1" stop-color="${stops.to}"/></linearGradient>`
  return svg.replace(PAINT0_PATTERN, replacement)
}
