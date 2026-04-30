import { Page } from '@playwright/test'

export async function setDeterministicViewport(page: Page, w: number, h: number) {
  await page.setViewportSize({ width: w, height: h })
}

export async function waitForVirtualizationReady(page: Page, selector: string, minRows: number) {
  await page.waitForFunction(
    ({ sel, min }) => document.querySelectorAll(sel).length >= min,
    { sel: selector, min: minRows },
    { timeout: 10000 }
  )
}

export async function getInnerVirtualHeight(page: Page, containerSelector: string): Promise<number> {
  return page.evaluate((sel) => {
    const container = document.querySelector(sel)
    if (!container) return 0
    // The inner positioning div is the first child with position:relative and explicit height
    const inner = container.querySelector('[style*="position: relative"]') as HTMLElement | null
    return inner ? inner.getBoundingClientRect().height : 0
  }, containerSelector)
}

export async function interceptApiWith(page: Page, urlPattern: string, fixture: unknown) {
  await page.route(urlPattern, (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture) })
  })
}

export const SELECTORS = {
  marketplace: {
    list: {
      container: 'div[class*="h-full"][class*="rounded-sm"][class*="px-0"]',
      row: 'a[class*="group"][class*="border-tertiary"][class*="h-[60px]"][class*="justify-between"][class*="transition"]',
      skeleton: 'div[class*="px-md"][class*="border-tertiary"][class*="h-[60px]"][class*="border-b"]',
    },
    grid: {
      container: 'div[class*="h-full"][class*="rounded-sm"][class*="md:px-md"][class*="lg:px-lg"]',
      card: 'a[class*="group"][class*="bg-secondary"][class*="rounded-sm"][class*="opacity-100"]',
      skeleton: 'div[class*="bg-secondary"][class*="animate-pulse"][class*="rounded-lg"]',
    },
  },
  offers: {
    container: 'div[class*="h-full"][class*="rounded-sm"][class*="px-0"]',
    row: 'div[class*="group"][class*="border-tertiary"][class*="h-[60px]"][class*="hover:bg-white/10"]',
    skeleton: 'div[class*="px-md"][class*="border-tertiary"][class*="h-[60px]"][class*="border-b"]',
  },
  activity: {
    container: 'div[class*="h-full"][class*="rounded-sm"][class*="px-0"]',
    row: 'div[class*="group"][class*="border-tertiary"][class*="h-[86px]"][class*="sm:h-[60px]"]',
    skeleton: 'div[class*="px-md"][class*="border-tertiary"][class*="h-[86px]"][class*="sm:h-[60px]"]',
  },
  leaderboard: {
    container: 'div.w-full:has(> div[class*="sticky"])',
    row: 'a[href^="/profile/"], div[class*="border-tertiary"][class*="md:hidden"]',
    skeleton:
      'div[class*="border-tertiary"][class*="h-[60px]"][class*="md:flex"], div[class*="border-tertiary"][class*="h-[60px]"][class*="md:hidden"]',
  },
  allHolders: {
    container: 'div.w-full:has(> div[class*="sticky"])',
    row: 'a[href^="/profile/"]',
    skeleton: 'div[class*="border-tertiary"][class*="h-[60px]"][class*="items-center"][class*="px-4"]',
  },
  holders: {
    container: 'div.w-full:has(> div[class*="sticky"])',
    row: 'a[href^="/profile/"]',
    skeleton: 'div[class*="border-tertiary"][class*="h-[60px]"][class*="items-center"][class*="px-4"]',
  },
} as const
