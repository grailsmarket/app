import { ens_normalize } from '@adraffy/ens-normalize'

export function normalizeValuationLabel(input: string): string | null {
  const stripped = input.replace(/\.eth$/i, '').trim()
  if (!stripped) return null

  const cleaned = stripped.replaceAll(' ', '').replaceAll('_', '').replaceAll('.', '').toLowerCase()
  if (!cleaned) return null

  try {
    return ens_normalize(cleaned)
  } catch {
    return null
  }
}

/**
 * Compact a generated term into a usable ENS label.
 *
 * LLMs return phrases ("tom cruise"), hyphenated compounds ("real-time"), and
 * the occasional long idiom. We:
 * - drop anything with 3+ whitespace-separated tokens (long phrases make junk ENS labels),
 * - compact spaces/hyphens/underscores/dots away,
 * - lowercase + ens_normalize.
 *
 * Returns null when the value is unusable.
 */
export function compactEnsLabel(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const tokenCount = trimmed.split(/\s+/).length
  if (tokenCount > 2) return null

  const compacted = trimmed
    .replaceAll(' ', '')
    .replaceAll('-', '')
    .replaceAll('_', '')
    .replaceAll('.', '')
    .toLowerCase()
  if (!compacted) return null

  try {
    return ens_normalize(compacted)
  } catch {
    return null
  }
}

export function dedupeNormalizedLabels(labels: string[]): string[] {
  const seen = new Set<string>()
  const output: string[] = []

  for (const label of labels) {
    const normalized = normalizeValuationLabel(label)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    output.push(normalized)
  }

  return output
}

export function ethToWeiString(value: string | number): string {
  const raw = String(value).trim()
  if (!/^\d+(\.\d+)?$/.test(raw)) {
    throw new Error('Invalid ETH amount')
  }

  const [whole, fractional = ''] = raw.split('.')
  const fractionalPadded = (fractional + '0'.repeat(18)).slice(0, 18)
  return (BigInt(whole) * BigInt(10) ** BigInt(18) + BigInt(fractionalPadded)).toString()
}

export function isWeiAtLeast(value: unknown, floorWei: string): boolean {
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'bigint') {
    return false
  }

  try {
    return BigInt(value) >= BigInt(floorWei)
  } catch {
    return false
  }
}
