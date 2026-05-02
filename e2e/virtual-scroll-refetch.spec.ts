import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const EVIDENCE_DIR = path.resolve(__dirname, '../.sisyphus/evidence/scroll-refetch')

interface RequestRecord {
  url: string
  method: string
  resourceType: string
}

function classifyUrl(url: string): string {
  if (
    url.includes('fetchAccount') ||
    url.includes('/api/profile') ||
    url.includes('ethereum-identity-kit') ||
    url.includes('enstate') ||
    url.includes('ens.domains/mainnet/avatar') ||
    url.includes('efp.app') ||
    url.includes('ethfollow')
  )
    return 'profile/fetchAccount'
  if (url.includes('broker') || url.includes('brokerAccount')) return 'brokerAccount'
  if (url.includes('watchlist')) return 'watchlist'
  if (url.includes('/clubs') || url.includes('categories')) return 'categories'
  if (url.includes('metadata.ens.domains') && url.includes('/image')) return 'ens-metadata-image'
  if (url.includes('/api/og/ens-name')) return 'local-og-image'
  if (url.includes('marketplace') || url.includes('domains') || url.includes('listings'))
    return 'marketplace-data'
  if (url.includes('ethprice') || url.includes('chainlink') || url.includes('alchemy'))
    return 'eth-price'
  return 'other'
}

test.describe('deep-scroll network baseline', () => {
  test.setTimeout(180_000)

  test('capture request storm during deep scroll on /marketplace', async ({ page }) => {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true })

    const requests: RequestRecord[] = []

    page.on('request', (req) => {
      requests.push({
        url: req.url(),
        method: req.method(),
        resourceType: req.resourceType(),
      })
    })

    const writeBaseline = () => {
      const grouped: Record<string, { count: number; urls: string[] }> = {}
      for (const req of requests) {
        const family = classifyUrl(req.url)
        if (!grouped[family]) grouped[family] = { count: 0, urls: [] }
        grouped[family].count++
        if (!grouped[family].urls.includes(req.url)) {
          grouped[family].urls.push(req.url)
        }
      }

      const urlCounts: Record<string, number> = {}
      for (const req of requests) {
        urlCounts[req.url] = (urlCounts[req.url] || 0) + 1
      }
      const top10RepeatedUrls = Object.entries(urlCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([url, count]) => ({ url, count }))

      const baseline = {
        capturedAt: new Date().toISOString(),
        totalRequests: requests.length,
        byFamily: grouped,
        top10RepeatedUrls,
      }

      fs.writeFileSync(
        path.join(EVIDENCE_DIR, 'baseline-network.json'),
        JSON.stringify(baseline, null, 2)
      )

      return baseline
    }

    try {
      await page.goto('/marketplace', { timeout: 30_000 }).catch(() => {})
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})

      await page
        .waitForFunction(
          () =>
            document.querySelectorAll('a[class*="border-tertiary"][class*="h-\\[60px\\]"]')
              .length >= 3,
          { timeout: 15_000 }
        )
        .catch(() => {})

      // Discard initial-load requests so the baseline only measures scroll-induced refetches
      requests.length = 0

      for (let i = 0; i < 15; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight)).catch(() => {})
        await page.waitForTimeout(200)
      }

      for (let i = 0; i < 5; i++) {
        await page
          .evaluate(() => window.scrollBy(0, -window.innerHeight * 3))
          .catch(() => {})
        await page.waitForTimeout(300)
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 3)).catch(() => {})
        await page.waitForTimeout(300)
      }
    } finally {
      const baseline = writeBaseline()
      console.log(
        'Baseline captured:',
        JSON.stringify(
          {
            totalRequests: baseline.totalRequests,
            families: Object.fromEntries(
              Object.entries(baseline.byFamily).map(([k, v]) => [k, v.count])
            ),
          },
          null,
          2
        )
      )
    }

    // No-op assertion: this is a capture spec, not a pass/fail spec
    expect(true).toBe(true)
  })
})
