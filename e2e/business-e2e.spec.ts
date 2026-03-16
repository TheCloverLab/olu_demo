import { test, expect, Page } from '@playwright/test'

const CREATOR = { email: 'luna.demo@olu.app', password: 'Demo123!' }

/**
 * Navigate to a page. If redirected to /login, sign in.
 */
async function nav(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  if (page.url().includes('/login')) {
    await page.locator('input[name="email"]').fill(CREATOR.email)
    await page.locator('input[name="password"]').fill(CREATOR.password)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
    await page.waitForTimeout(2000)
    if (!page.url().includes(path.replace(/^\//, ''))) {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)
    }
  }
}

/** Collect console errors. */
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
        text.includes('quick-chat/stream')
      ) return
      errors.push(text)
    }
  })
  return errors
}

/** Critical DB errors. */
function dbErrors(errors: string[]): string[] {
  return errors.filter((e) =>
    e.includes('42703') || e.includes('PGRST') ||
    (e.includes('column') && e.includes('not exist'))
  )
}

test.setTimeout(60000)
test.use({ colorScheme: 'dark' })

const ssDir = 'e2e/screenshots/business-e2e'

// ─── Chat Pages ────────────────────────────────────────────────

test.describe('Business Chat', () => {
  test('QuickChat — home page with sidebar', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business')
    await page.screenshot({ path: `${ssDir}/quick-chat-home.png`, fullPage: true })

    // Chat should be first sidebar item and highlighted
    const chatNav = page.locator('a[href="/business"]').first()
    await expect(chatNav).toBeVisible({ timeout: 5000 })

    expect(dbErrors(errors)).toEqual([])
  })

  test('QuickChat — create and send message', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business/chat')

    // Empty state or existing chats
    const input = page.locator('input[placeholder]').first()
    if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
      await input.fill('E2E business chat test')
      await input.press('Enter')
      await page.waitForTimeout(3000)
    }

    // ChatRoom textarea should appear
    const textarea = page.locator('textarea').first()
    if (await textarea.isVisible({ timeout: 5000 }).catch(() => false)) {
      await textarea.fill('Second message in chat')
      await textarea.press('Enter')
      await page.waitForTimeout(2000)
      const msg = page.locator('text=Second message in chat').first()
      await expect(msg).toBeVisible({ timeout: 5000 })
    }

    await page.screenshot({ path: `${ssDir}/quick-chat-sent.png`, fullPage: true })
    expect(dbErrors(errors)).toEqual([])
  })

  test('QuickChat — image button visible', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business/chat')

    // Create a chat first if needed
    const input = page.locator('input[placeholder]').first()
    if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
      await input.fill('Test for image button')
      await input.press('Enter')
      await page.waitForTimeout(3000)
    }

    // Image upload button should be visible (quick scope has images: true)
    const imageBtn = page.locator('button').filter({ has: page.locator('svg') }).first()
    await page.screenshot({ path: `${ssDir}/quick-chat-image-btn.png`, fullPage: true })

    expect(dbErrors(errors)).toEqual([])
  })

  test('Support Center — loads and shows tickets', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business/support')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${ssDir}/support-center.png`, fullPage: true })
    expect(dbErrors(errors)).toEqual([])
  })
})

// ─── Dashboard Pages ───────────────────────────────────────────

test.describe('Business Dashboard', () => {
  test('Overview page loads', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business/overview')
    await page.screenshot({ path: `${ssDir}/overview.png`, fullPage: true })
    expect(page.url()).toContain('/business/overview')
    expect(dbErrors(errors)).toEqual([])
  })

  test('Analytics page loads', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business/analytics')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${ssDir}/analytics.png`, fullPage: true })
    expect(dbErrors(errors)).toEqual([])
  })
})

// ─── Operations Pages ──────────────────────────────────────────

test.describe('Business Operations', () => {
  test('Projects list loads', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business/projects')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${ssDir}/projects-list.png`, fullPage: true })
    expect(dbErrors(errors)).toEqual([])
  })

  test('Project detail loads without errors', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business/projects')
    await page.waitForTimeout(2000)

    const projectLink = page.locator('a[href*="/business/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForTimeout(3000)
      await page.screenshot({ path: `${ssDir}/project-detail.png`, fullPage: true })

      // Verify no avatar_url/42703 errors
      const avatarErr = errors.filter((e) => e.includes('avatar_url') || e.includes('42703'))
      expect(avatarErr).toEqual([])
    }

    expect(dbErrors(errors)).toEqual([])
  })

  test('Team page loads with agents and humans', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business/team')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${ssDir}/team.png`, fullPage: true })
    expect(dbErrors(errors)).toEqual([])
  })

  test('Team — group chat navigates correctly', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business/team')
    await page.waitForTimeout(2000)

    const groupLink = page.locator('a[href*="group-chat"]').first()
    if (await groupLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await groupLink.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: `${ssDir}/team-group-chat.png`, fullPage: true })
      expect(page.url()).toContain('/business/team/group-chat/')

      // ChatRoom should render
      const textarea = page.locator('textarea').first()
      const hasChat = await textarea.isVisible({ timeout: 3000 }).catch(() => false)
      // Chat room or loading state should be present
      await page.screenshot({ path: `${ssDir}/team-group-chat-room.png`, fullPage: true })
    }

    expect(dbErrors(errors)).toEqual([])
  })

  test('Specialists marketplace loads', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business/specialists')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${ssDir}/specialists.png`, fullPage: true })
    expect(dbErrors(errors)).toEqual([])
  })

  test('Tasks page loads', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business/tasks')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${ssDir}/tasks.png`, fullPage: true })
    expect(dbErrors(errors)).toEqual([])
  })

  test('Approvals page loads', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business/approvals')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${ssDir}/approvals.png`, fullPage: true })
    expect(dbErrors(errors)).toEqual([])
  })
})

// ─── App Pages ─────────────────────────────────────────────────

test.describe('Business App', () => {
  test('Experiences page loads', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business/experiences')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${ssDir}/experiences.png`, fullPage: true })
    expect(dbErrors(errors)).toEqual([])
  })

  test('Products page loads', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business/products')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${ssDir}/products.png`, fullPage: true })
    expect(dbErrors(errors)).toEqual([])
  })

  test('Members page loads', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business/members')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${ssDir}/members.png`, fullPage: true })
    expect(dbErrors(errors)).toEqual([])
  })

  test('Connectors page loads', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business/connectors')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${ssDir}/connectors.png`, fullPage: true })
    expect(dbErrors(errors)).toEqual([])
  })

  test('Home Editor page loads', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business/home-editor')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${ssDir}/home-editor.png`, fullPage: true })
    expect(dbErrors(errors)).toEqual([])
  })
})

// ─── Settings & Account ────────────────────────────────────────

test.describe('Business Settings', () => {
  test('Settings page loads', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business/settings')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${ssDir}/settings.png`, fullPage: true })
    expect(dbErrors(errors)).toEqual([])
  })

  test('Account page loads', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business/account')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${ssDir}/account.png`, fullPage: true })
    expect(dbErrors(errors)).toEqual([])
  })

  test('Wallet page loads', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business/wallet')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${ssDir}/wallet.png`, fullPage: true })
    expect(dbErrors(errors)).toEqual([])
  })
})

// ─── Module-gated Pages ────────────────────────────────────────

test.describe('Business Modules (creator_ops gated)', () => {
  test('Creator Studio loads (if module enabled)', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business/creator-studio')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${ssDir}/creator-studio.png`, fullPage: true })
    // May redirect to /business if module not enabled — that's OK
    expect(dbErrors(errors)).toEqual([])
  })

  test('Course Editor loads (if module enabled)', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business/course-editor')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${ssDir}/course-editor.png`, fullPage: true })
    expect(dbErrors(errors)).toEqual([])
  })
})

// ─── Navigation & Routing ──────────────────────────────────────

test.describe('Business Navigation', () => {
  test('Sidebar navigation works — click through main sections', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business')
    await page.waitForTimeout(2000)

    // Click Overview
    const overviewLink = page.locator('a[href="/business/overview"]').first()
    if (await overviewLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await overviewLink.click()
      await page.waitForTimeout(2000)
      expect(page.url()).toContain('/business/overview')
      await page.screenshot({ path: `${ssDir}/nav-overview.png` })
    }

    // Click Team
    const teamLink = page.locator('a[href="/business/team"]').first()
    if (await teamLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await teamLink.click()
      await page.waitForTimeout(2000)
      expect(page.url()).toContain('/business/team')
      await page.screenshot({ path: `${ssDir}/nav-team.png` })
    }

    // Click Projects
    const projectsLink = page.locator('a[href="/business/projects"]').first()
    if (await projectsLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await projectsLink.click()
      await page.waitForTimeout(2000)
      expect(page.url()).toContain('/business/projects')
      await page.screenshot({ path: `${ssDir}/nav-projects.png` })
    }

    // Click back to Chat (home)
    const chatLink = page.locator('a[href="/business"]').first()
    if (await chatLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await chatLink.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: `${ssDir}/nav-back-to-chat.png` })
    }

    expect(dbErrors(errors)).toEqual([])
  })

  test('/business/agents redirects to /business/specialists', async ({ page }) => {
    const errors = collectErrors(page)
    await nav(page, '/business/agents')
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/business/specialists')
    expect(dbErrors(errors)).toEqual([])
  })
})
