import { GRACE_PERIOD, PREMIUM, UNREGISTERED } from '@/constants/domains/registrationStatuses'
import { RegistrationStatus } from '@/types/domains'

// The metadata service renders every normalized name onto the blue `paint0`
// gradient so its output is a pure function of `(name, avatar, records)`
// and can be cached for a year. State-driven coloring is applied here at
// render time because expiry transitions are time-driven, not event-driven,
// and the server has no way to know which state a cached image should be in.
//
// Non-normalized names use `paint1` (red) + warning badge on the server,
// which we intentionally leave untouched: normalization status is not
// time-dependent.
//
// If the name has an avatar, the server renders `<image>` as the background
// instead of a gradient-filled rect, and `paint0` is absent — the regex
// below finds nothing and the SVG passes through unchanged, so avatars
// always win over state coloring.

type GradientStops = { from: string; to: string }

// Match the gradients we previously shipped in the metadata service (PR #6
// `feat(image): soften expired/grace/premium gradients to 2-stop mid→dark`).
// REGISTERED intentionally absent — keep the server's default blue paint0.
const STATE_GRADIENTS: Partial<Record<RegistrationStatus, GradientStops>> = {
  [GRACE_PERIOD]: { from: 'rgb(161 119 1)', mid: '#CC9500', to: 'rgb(228 186 61)' },
  [PREMIUM]: { from: '#3AAF8A', mid: '#2AAF63', to: '#2AAF2A' },
  [UNREGISTERED]: { from: '#4460A7', mid: '#1B6E9B', to: 'rgb(39 161 214)' },
}

const PAINT0_PATTERN = /<linearGradient id="paint0_linear"[^>]*>[\s\S]*?<\/linearGradient>/

export function applyStateGradient(svg: string, status: RegistrationStatus): string {
  const stops = STATE_GRADIENTS[status]
  if (!stops) return svg
  const replacement = `<linearGradient id="paint0_linear" x1="0" y1="0" x2="269.553" y2="285.527" gradientUnits="userSpaceOnUse"><stop stop-color="${stops.from}"/><stop offset="0.25" stop-color="${stops.mid}"/><stop offset="1" stop-color="${stops.to}"/></linearGradient>`
  return svg.replace(PAINT0_PATTERN, replacement)
}
