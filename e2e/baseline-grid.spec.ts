import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const BASELINE_DIR = path.join('e2e', '.baselines')
const CARD_SELECTOR = 'a[class*="group"][class*="bg-secondary"][class*="rounded-sm"][class*="opacity-100"]'

const VIEWPORTS = [
  { width: 640, height: 800, name: '640' },
  { width: 1280, height: 800, name: '1280' },
  { width: 1920, height: 1080, name: '1920' },
] as const

test.describe.configure({ mode: 'serial' })

for (const vp of VIEWPORTS) {
  test(`grid baseline at ${vp.width}x${vp.height}`, async ({ page }) => {
    test.setTimeout(60_000)

    await page.setViewportSize({ width: vp.width, height: vp.height })

    await page.goto('/marketplace')
    await page.waitForLoadState('networkidle')

    const cardVisible = await page
      .locator(CARD_SELECTOR)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false)

    if (!cardVisible) {
      const gridToggle = page.locator('button[aria-label*="grid" i], button:has(img[alt="Grid layout"])').first()
      if (await gridToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await gridToggle.click()
      } else {
        await page.goto('/marketplace?view=grid')
      }
      await page.waitForLoadState('networkidle')
    }

    await page.waitForFunction(
      (sel) => document.querySelectorAll(sel).length >= 3,
      CARD_SELECTOR,
      { timeout: 20_000 }
    )

    const data = await page.evaluate((cardSelector) => {
      const cardLink = document.querySelector<HTMLElement>(cardSelector)
      const cardWrapper = (cardLink?.closest('div[style*="position: absolute"]') as HTMLElement | null) ?? null
      const spacer = (cardWrapper?.parentElement as HTMLElement | null) ?? null
      const outerWrapper = (spacer?.parentElement as HTMLElement | null) ?? null

      const cards = spacer
        ? (Array.from(spacer.children).filter(
            (el) => el instanceof HTMLElement && el.style.position === 'absolute'
          ) as HTMLElement[])
        : []

      const firstRowTop = cards.length > 0 ? Math.min(...cards.map((c) => parseInt(c.style.top || '0', 10))) : 0
      const firstRowCards = cards.filter((c) => parseInt(c.style.top || '0', 10) === firstRowTop)
      const firstCard = firstRowCards[0] ?? cards[0] ?? null

      const firstCardRect = firstCard?.getBoundingClientRect()
      const spacerRect = spacer?.getBoundingClientRect()

      return {
        totalHeight: spacerRect ? spacerRect.height : 0,
        renderedCards: cards.length,
        columnsCount: firstRowCards.length,
        firstCardLeft: firstCardRect ? firstCardRect.left : 0,
        firstCardWidth: firstCardRect ? firstCardRect.width : 0,
        paddingBottomPx: outerWrapper
          ? parseInt(getComputedStyle(outerWrapper).paddingBottom, 10) || 0
          : 0,
        itemCount: cards.length,
        cardHeight: firstCardRect ? firstCardRect.height : 0,
        gap: 4,
      }
    }, CARD_SELECTOR)

    const baseline = {
      route: '/marketplace',
      viewport: { width: vp.width, height: vp.height },
      ...data,
      capturedAt: new Date().toISOString(),
    }

    fs.mkdirSync(BASELINE_DIR, { recursive: true })
    fs.writeFileSync(
      path.join(BASELINE_DIR, `grid-marketplace-${vp.name}.json`),
      JSON.stringify(baseline, null, 2)
    )

    expect(baseline.totalHeight).toBeGreaterThan(0)
    expect(baseline.columnsCount).toBeGreaterThan(0)
    expect(baseline.renderedCards).toBeGreaterThanOrEqual(3)
    expect(baseline.firstCardWidth).toBeGreaterThan(0)
    expect(baseline.cardHeight).toBeGreaterThan(0)
  })
}
