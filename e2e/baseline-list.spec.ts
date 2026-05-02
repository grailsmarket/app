import { test, expect, Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { SELECTORS } from './helpers/page-utils'

interface BaselineData {
  route: string
  viewport: { width: number; height: number }
  totalHeight: number
  renderedRows: number
  firstRowTop: number
  lastRowTop: number
  paddingBottomPx: number
  itemCount: number
  rowHeight: number
  gap: number
  capturedAt: string
}

const VIEWPORT = { width: 1280, height: 800 }
const BASELINE_DIR = path.resolve(__dirname, '.baselines')

function ensureBaselineDir(): void {
  if (!fs.existsSync(BASELINE_DIR)) {
    fs.mkdirSync(BASELINE_DIR, { recursive: true })
  }
}

interface CapturedMetrics {
  totalHeight: number
  renderedRows: number
  firstRowTop: number
  lastRowTop: number
  paddingBottomPx: number
  rowHeight: number
}

async function captureListBaseline(
  page: Page,
  route: string,
  rowSelector: string,
  expectedRowHeight = 60,
  gap = 0
): Promise<BaselineData> {
  await page.goto(route)
  // networkidle can stall on long-poll / streaming routes; treat as best-effort.
  await page.waitForLoadState('networkidle').catch(() => {})

  await page.waitForFunction((sel) => document.querySelectorAll(sel).length >= 3, rowSelector, { timeout: 30_000 })

  const metrics = await page.evaluate(
    ({ rowSel }): CapturedMetrics => {
      // Find the inner spacer div: it's a div with inline style `position: relative`
      // and an explicit pixel height > a typical viewport. The current VirtualList renders:
      //   <div style="position:relative; padding-bottom:80px; width:100%">
      //     <div style="width:100%; height:{totalHeight}px; position:relative">  <-- spacer
      //       <div style="position:absolute; top:..."> ... </div>
      //     </div>
      //   </div>
      const candidates = Array.from(document.querySelectorAll<HTMLElement>('div[style*="position: relative"]'))
      let spacer: HTMLElement | null = null
      let bestHeight = 0
      for (const el of candidates) {
        const style = el.getAttribute('style') || ''
        const heightMatch = /height:\s*(\d+(?:\.\d+)?)px/.exec(style)
        if (!heightMatch) continue
        const h = parseFloat(heightMatch[1])
        if (h > bestHeight) {
          bestHeight = h
          spacer = el
        }
      }

      const totalHeight = spacer ? spacer.getBoundingClientRect().height : 0

      const rows = Array.from(document.querySelectorAll<HTMLElement>(rowSel))
      const firstRow = rows[0]
      const lastRow = rows[rows.length - 1]

      const firstRect = firstRow ? firstRow.getBoundingClientRect() : null
      const lastRect = lastRow ? lastRow.getBoundingClientRect() : null

      // Outer wrapper paddingBottom: walk up from spacer until we find a div with non-zero paddingBottom.
      let paddingBottom = 0
      let walker: HTMLElement | null = spacer ? spacer.parentElement : null
      while (walker) {
        const cs = getComputedStyle(walker)
        const pb = parseFloat(cs.paddingBottom || '0')
        if (pb > 0) {
          paddingBottom = pb
          break
        }
        walker = walker.parentElement
      }

      return {
        totalHeight,
        renderedRows: rows.length,
        firstRowTop: firstRect ? firstRect.top : 0,
        lastRowTop: lastRect ? lastRect.top : 0,
        paddingBottomPx: paddingBottom,
        rowHeight: firstRect ? firstRect.height : 0,
      }
    },
    { rowSel: rowSelector }
  )

  // Approximate itemCount from totalHeight when the math holds (gap=0 routes).
  // Fallback to renderedRows if the math doesn't make sense.
  const computedItemCount =
    metrics.totalHeight > 0 && expectedRowHeight + gap > 0
      ? Math.round(metrics.totalHeight / (expectedRowHeight + gap))
      : metrics.renderedRows

  return {
    route,
    viewport: { ...VIEWPORT },
    totalHeight: metrics.totalHeight,
    renderedRows: metrics.renderedRows,
    firstRowTop: metrics.firstRowTop,
    lastRowTop: metrics.lastRowTop,
    paddingBottomPx: metrics.paddingBottomPx,
    itemCount: computedItemCount,
    rowHeight: metrics.rowHeight || expectedRowHeight,
    gap,
    capturedAt: new Date().toISOString(),
  }
}

function writeBaseline(name: string, data: BaselineData): string {
  ensureBaselineDir()
  const outPath = path.join(BASELINE_DIR, `list-${name}.json`)
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n', 'utf8')
  return outPath
}

function assertValidBaseline(data: BaselineData): void {
  expect(data.totalHeight, 'totalHeight should be > 0').toBeGreaterThan(0)
  expect(data.renderedRows, 'renderedRows should be >= 3').toBeGreaterThanOrEqual(3)
  expect(typeof data.firstRowTop).toBe('number')
  expect(typeof data.lastRowTop).toBe('number')
  expect(typeof data.paddingBottomPx).toBe('number')
  expect(data.rowHeight, 'rowHeight should be > 0').toBeGreaterThan(0)
  expect(typeof data.capturedAt).toBe('string')
}

test.describe('Pre-migration VirtualList baselines', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT)
  })

  test('baseline /marketplace (Domains list)', async ({ page }) => {
    const data = await captureListBaseline(page, '/marketplace', SELECTORS.marketplace.list.row, 60, 0)
    const written = writeBaseline('marketplace', data)
    assertValidBaseline(data)
    expect(fs.existsSync(written)).toBe(true)
  })

  test('baseline /leaderboard (LeaderboardList)', async ({ page }) => {
    const data = await captureListBaseline(page, '/leaderboard', SELECTORS.leaderboard.row, 60, 0)
    const written = writeBaseline('leaderboard', data)
    assertValidBaseline(data)
    expect(fs.existsSync(written)).toBe(true)
  })

  test('baseline /categories (allHoldersPanel)', async ({ page }) => {
    const data = await captureListBaseline(page, '/categories', SELECTORS.allHolders.row, 60, 0)
    const written = writeBaseline('categories', data)
    assertValidBaseline(data)
    expect(fs.existsSync(written)).toBe(true)
  })

  // Note: /offers and /categories/[slug] require specific data/auth state and are
  // intentionally skipped here per task scope. The 3 routes above cover the
  // minimum viable baseline for the VirtualList window-mode migration.
  test.skip('baseline /offers (Offers list) — skipped: requires specific data', async () => {})
  test.skip('baseline /categories/[slug] (holders) — skipped: requires slug discovery', async () => {})
})
