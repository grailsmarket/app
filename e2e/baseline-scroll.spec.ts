import { test, expect } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { SELECTORS } from './helpers/page-utils'

const BASELINE_PATH = resolve(__dirname, '.baselines/scroll-behavior.json')
const MARKETPLACE_ROW_HEIGHT = 60

type Baseline = {
  domRowCount: number | null
  itemCount: number | null
  activityContainerScrollIndependent: boolean | null
  capturedAt: string
}

const baseline: Baseline = {
  domRowCount: null,
  itemCount: null,
  activityContainerScrollIndependent: null,
  capturedAt: new Date().toISOString(),
}

const writeBaseline = () => {
  mkdirSync(dirname(BASELINE_PATH), { recursive: true })
  writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2))
}

test.describe.serial('scroll behavior baseline (pre-migration)', () => {
  test('DOM count bound - virtualization works on /marketplace', async ({ page, context }) => {
    await context.addInitScript(() => {
      const persisted = {
        view: JSON.stringify({ viewType: 'list' }),
        _persist: JSON.stringify({ version: 3, rehydrated: true }),
      }
      try {
        window.localStorage.setItem('persist:root', JSON.stringify(persisted))
      } catch {}
    })

    const rowSelector = SELECTORS.marketplace.list.row

    await page.goto('/marketplace')
    await page.waitForLoadState('networkidle')

    await page.waitForFunction(
      (sel) => document.querySelectorAll(sel).length >= 3,
      rowSelector,
      { timeout: 30000 }
    )

    const domRowCount = await page.evaluate(
      (sel) => document.querySelectorAll(sel).length,
      rowSelector
    )

    expect(domRowCount).toBeGreaterThan(0)
    expect(domRowCount).toBeLessThanOrEqual(60)

    const itemCount = await page.evaluate((rowHeight) => {
      const inner = document.querySelector(
        'div[style*="position: relative"][style*="height"]'
      ) as HTMLElement | null
      if (!inner) return null
      const heightPx = parseFloat(inner.style.height.replace('px', ''))
      if (!Number.isFinite(heightPx) || heightPx <= 0) return null
      const total = Math.round(heightPx / rowHeight)
      return Number.isFinite(total) && total > 0 ? total : null
    }, MARKETPLACE_ROW_HEIGHT)

    baseline.domRowCount = domRowCount
    baseline.itemCount = itemCount
  })

  test('activity container scroll independence at >=1024px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const containerSelector =
      'div[style*="overflow-y: auto"][style*="position: relative"]'

    const isVisible = await page
      .locator(containerSelector)
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)

    if (!isVisible) {
      baseline.activityContainerScrollIndependent = null
      test.info().annotations.push({
        type: 'note',
        description: 'no overflow-y:auto VirtualList container visible on / — recorded as null',
      })
      return
    }

    const container = page.locator(containerSelector).first()

    await container.evaluate((el) => {
      ;(el as HTMLElement).scrollTop = 200
    })

    const windowScrollY = await page.evaluate(() => window.scrollY)
    const containerScrollTop = await container.evaluate((el) => (el as HTMLElement).scrollTop)

    baseline.activityContainerScrollIndependent =
      windowScrollY === 0 && containerScrollTop > 0
  })

  test.afterAll(() => {
    baseline.capturedAt = new Date().toISOString()
    writeBaseline()
  })
})
