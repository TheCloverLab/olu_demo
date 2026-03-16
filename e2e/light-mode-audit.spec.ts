import { test } from '@playwright/test'

async function mockAuth(page) {
  await page.route('**/demo-placeholder.supabase.co/**', (route) => {
    const url = route.request().url()
    if (url.includes('/rest/v1/')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    }
    if (url.includes('/realtime/')) return route.abort()
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })

  await page.addInitScript(() => {
    const session = {
      access_token: 'test', token_type: 'bearer', expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'test',
      user: {
        id: 'test-id', aud: 'authenticated', role: 'authenticated', email: 'test@test.com',
        email_confirmed_at: '2025-01-01', user_metadata: { name: 'Test User' },
        app_metadata: { provider: 'email' }, created_at: '2025-01-01',
      },
    }
    localStorage.setItem('sb-demo-placeholder-auth-token', JSON.stringify(session))
  })
}

async function gotoLight(page, path: string) {
  await mockAuth(page)
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
  })
  await page.waitForTimeout(2500)
}

test.describe('Light Mode Contrast Audit — Business Pages', () => {
  test.use({ colorScheme: 'light' })

  const BUSINESS_PAGES = [
    { path: '/business', name: 'dashboard' },
    { path: '/business/analytics', name: 'analytics' },
    { path: '/business/projects', name: 'projects' },
    { path: '/business/chat', name: 'chat' },
    { path: '/business/team', name: 'team' },
    { path: '/business/apps', name: 'apps' },
    { path: '/business/experiences', name: 'experiences' },
    { path: '/business/products', name: 'products' },
    { path: '/business/specialists', name: 'specialists' },
    { path: '/business/support', name: 'support' },
    { path: '/business/home-editor', name: 'home-editor' },
    { path: '/business/members', name: 'members' },
    { path: '/business/connectors', name: 'connectors' },
    { path: '/business/tasks', name: 'tasks' },
    { path: '/business/approvals', name: 'approvals' },
    { path: '/business/account', name: 'account' },
    { path: '/business/settings', name: 'settings' },
    { path: '/business/wallet', name: 'wallet' },
    { path: '/business/creator-studio', name: 'creator-studio' },
    { path: '/business/course-editor', name: 'course-editor' },
    { path: '/business/modules/creator', name: 'creator-console' },
    { path: '/business/modules/marketing', name: 'advertiser-console' },
    { path: '/business/modules/supply', name: 'supplier-console' },
  ]

  for (const { path, name } of BUSINESS_PAGES) {
    test(`${name} light mode`, async ({ page }) => {
      await gotoLight(page, path)
      await page.screenshot({ path: `e2e/screenshots/light-${name}.png`, fullPage: true })
    })
  }
})

test.describe('Light Mode Contrast Audit — Consumer Pages', () => {
  test.use({ colorScheme: 'light' })

  const CONSUMER_PAGES = [
    { path: '/discover', name: 'discover' },
    { path: '/feed', name: 'feed' },
    { path: '/gallery', name: 'gallery' },
    { path: '/topics', name: 'topics' },
    { path: '/courses', name: 'courses' },
    { path: '/membership', name: 'membership' },
    { path: '/shop', name: 'shop' },
  ]

  for (const { path, name } of CONSUMER_PAGES) {
    test(`${name} light mode`, async ({ page }) => {
      await gotoLight(page, path)
      await page.screenshot({ path: `e2e/screenshots/light-consumer-${name}.png`, fullPage: true })
    })
  }
})
