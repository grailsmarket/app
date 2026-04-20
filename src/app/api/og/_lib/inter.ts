import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

type InterFont = {
  name: 'Inter'
  data: Buffer
  weight: 400 | 600 | 700
  style: 'normal'
}

let cached: InterFont[] | null = null

const WEIGHTS: { file: string; weight: 400 | 600 | 700 }[] = [
  { file: 'Inter-Regular.ttf', weight: 400 },
  { file: 'Inter-SemiBold.ttf', weight: 600 },
  { file: 'Inter-Bold.ttf', weight: 700 },
]

export async function getInterFonts(): Promise<InterFont[]> {
  if (cached) return cached
  const dir = join(process.cwd(), 'public/fonts/inter')
  const loaded = await Promise.all(
    WEIGHTS.map(async ({ file, weight }) => ({
      name: 'Inter' as const,
      data: await readFile(join(dir, file)),
      weight,
      style: 'normal' as const,
    }))
  )
  cached = loaded
  return loaded
}
