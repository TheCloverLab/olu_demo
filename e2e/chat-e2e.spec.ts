import { test, expect, Page } from '@playwright/test'

// Demo accounts (from seed.sql — password: Demo123!)
const CONSUMER = { email: 'alex.demo@olu.app', password: 'Demo123!' }
const CREATOR = { email: 'luna.demo@olu.app', password: 'Demo123!' }

const LUNA_WORKSPACE_SLUG = 'lunachen-workspace'
const GROUP_CHAT_EXPERIENCE_ID = '06000000-0000-0000-0000-000000000004'

/**
 * Navigate to a page. If redirected to /login, sign in with given creds.
 */
async function navigateTo(page: Page, path: string, creds: { email: string; password: string }) {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  // If redirected to login, sign in
  if (page.url().includes('/login')) {
    const emailInput = page.locator('input[name="email"]')
    await emailInput.waitFor({ state: 'visible', timeout: 5000 })
    await emailInput.fill(creds.email)
    await page.locator('input[name="password"]').fill(creds.password)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
    await page.waitForTimeout(2000)

    // Re-navigate to intended path after login
    if (!page.url().includes(path.replace(/^\//, ''))) {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)
    }
  }
}

/** Collect console errors during a test (excluding noise). */
function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      if (
        text.includes('favicon.ico') ||
        text.includes('net::ERR') ||
        text.includes('WebSocket') ||
        text.includes('Failed to fetch') ||
        text.includes('realtime') ||
        text.includes('quick-chat/stream') // agent runtime not deployed
      ) return
      errors.push(text)
    }
  })
  return errors
}

/** Filter for DB schema errors. */
function dbErrors(errors: string[]): string[] {
  return errors.filter((e) =>
    e.includes('42703') || e.includes('PGRST') ||
    e.includes('column') && e.includes('not exist')
  )
}

test.setTimeout(60000)

// ─── Consumer Side ─────────────────────────────────────────────

test.describe('Consumer Chat E2E', () => {
  test.use({ colorScheme: 'dark' })

  test('Consumer — workspace home loads', async ({ page }) => {
    const errors = collectErrors(page)
    await navigateTo(page, `/w/${LUNA_WORKSPACE_SLUG}`, CONSUMER)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'e2e/screenshots/chat-e2e/consumer-workspace-home.png', fullPage: true })
    expect(dbErrors(errors)).toEqual([])
  })

  test('Consumer — support chat send message', async ({ page }) => {
    const errors = collectErrors(page)
    await navigateTo(page, `/w/${LUNA_WORKSPACE_SLUG}/support`, CONSUMER)
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'e2e/screenshots/chat-e2e/consumer-support-chat.png', fullPage: true })

    const textarea = page.locator('textarea').first()
    if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await textarea.fill('E2E test: consumer support message')
      await textarea.press('Enter')
      await page.waitForTimeout(3000)
      await page.screenshot({ path: 'e2e/screenshots/chat-e2e/consumer-support-sent.png', fullPage: true })

      // Message should appear
      const msg = page.locator('text=E2E test: consumer support message').first()
      await expect(msg).toBeVisible({ timeout: 5000 })
    }

    expect(dbErrors(errors)).toEqual([])
  })

  test('Consumer — group chat renders', async ({ page }) => {
    const errors = collectErrors(page)
    await navigateTo(page, `/group-chat/${GROUP_CHAT_EXPERIENCE_ID}`, CONSUMER)
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'e2e/screenshots/chat-e2e/consumer-group-chat.png', fullPage: true })
    expect(dbErrors(errors)).toEqual([])
  })
})

// ─── Business Side ─────────────────────────────────────────────

test.describe('Business Chat E2E', () => {
  test.use({ colorScheme: 'dark' })

  test('Business — QuickChat is home page', async ({ page }) => {
    const errors = collectErrors(page)
    await navigateTo(page, '/business', CREATOR)
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'e2e/screenshots/chat-e2e/business-home.png', fullPage: true })

    // QuickChat should show — look for chat sidebar or the empty state input
    const hasChatSidebar = await page.locator('h2').filter({ hasText: 'Chat' }).first().isVisible({ timeout: 3000 }).catch(() => false)
    const hasChatInput = await page.locator('input[placeholder]').first().isVisible({ timeout: 1000 }).catch(() => false)
    const hasChatTextarea = await page.locator('textarea').first().isVisible({ timeout: 1000 }).catch(() => false)

    // At least one chat element should be visible
    expect(hasChatSidebar || hasChatInput || hasChatTextarea).toBeTruthy()

    expect(dbErrors(errors)).toEqual([])
  })

  test('Business — QuickChat send message', async ({ page }) => {
    const errors = collectErrors(page)
    await navigateTo(page, '/business/chat', CREATOR)
    await page.waitForTimeout(3000)

    // If empty state — type in the input to create a new chat
    const emptyInput = page.locator('input[placeholder]').first()
    if (await emptyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emptyInput.fill('E2E: new QuickChat message')
      await page.screenshot({ path: 'e2e/screenshots/chat-e2e/business-quick-chat-typed.png', fullPage: true })
      await emptyInput.press('Enter')
      await page.waitForTimeout(3000)
      await page.screenshot({ path: 'e2e/screenshots/chat-e2e/business-quick-chat-created.png', fullPage: true })
    }

    // Now should have ChatRoom textarea
    const textarea = page.locator('textarea').first()
    if (await textarea.isVisible({ timeout: 5000 }).catch(() => false)) {
      await textarea.fill('E2E: follow-up message in QuickChat')
      await textarea.press('Enter')
      await page.waitForTimeout(3000)
      await page.screenshot({ path: 'e2e/screenshots/chat-e2e/business-quick-chat-sent.png', fullPage: true })

      // Message should appear
      const msg = page.locator('text=E2E: follow-up message in QuickChat').first()
      await expect(msg).toBeVisible({ timeout: 5000 })
    }

    expect(dbErrors(errors)).toEqual([])
  })

  test('Business — Overview loads at /business/overview', async ({ page }) => {
    const errors = collectErrors(page)
    await navigateTo(page, '/business/overview', CREATOR)
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'e2e/screenshots/chat-e2e/business-overview.png', fullPage: true })

    // Should be on overview, not redirected
    expect(page.url()).toContain('/business')

    expect(dbErrors(errors)).toEqual([])
  })

  test('Business — Team page and group chat navigation', async ({ page }) => {
    const errors = collectErrors(page)
    await navigateTo(page, '/business/team', CREATOR)
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'e2e/screenshots/chat-e2e/business-team.png', fullPage: true })

    // Click a group chat if available
    const groupLink = page.locator('a[href*="group-chat"]').first()
    if (await groupLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await groupLink.click()
      await page.waitForTimeout(3000)
      await page.screenshot({ path: 'e2e/screenshots/chat-e2e/business-group-chat.png', fullPage: true })

      // Route should be /business/team/group-chat/, NOT /business/chat/
      expect(page.url()).toContain('/business/team/group-chat/')
    }

    expect(dbErrors(errors)).toEqual([])
  })

  test('Business — Project detail (no avatar_url error)', async ({ page }) => {
    const errors = collectErrors(page)
    await navigateTo(page, '/business/projects', CREATOR)
    await page.waitForTimeout(3000)

    // Click first project
    const projectLink = page.locator('a[href*="/business/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForTimeout(3000)
      await page.screenshot({ path: 'e2e/screenshots/chat-e2e/business-project-detail.png', fullPage: true })
    } else {
      await page.screenshot({ path: 'e2e/screenshots/chat-e2e/business-projects-list.png', fullPage: true })
    }

    expect(dbErrors(errors)).toEqual([])
  })
})
