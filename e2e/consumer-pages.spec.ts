import { test } from '@playwright/test'

// Mock all Supabase API calls to bypass auth
async function mockAuth(page) {
  await page.route('**/*.supabase.co/**', (route) => {
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
    localStorage.setItem('sb-indiwmqxvnkzapsuvhyh-auth-token', JSON.stringify(session))
  })
}

async function gotoPage(page, path: string) {
  await mockAuth(page)
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
}

test.describe('Consumer Pages — Visual Verification', () => {
  test.use({ colorScheme: 'dark' })

  test('Feed page renders with posts and composer', async ({ page }) => {
    await gotoPage(page, '/feed')
    await page.screenshot({ path: 'e2e/screenshots/feed-page.png', fullPage: true })
  })

  test('Feed — open post composer', async ({ page }) => {
    await gotoPage(page, '/feed')
    const newPostBtn = page.locator('button', { hasText: /new post|发帖/i }).first()
    if (await newPostBtn.isVisible()) {
      await newPostBtn.click()
      await page.waitForTimeout(500)
    }
    await page.screenshot({ path: 'e2e/screenshots/feed-composer.png', fullPage: true })
  })

  test('Gallery page renders with albums and photos', async ({ page }) => {
    await gotoPage(page, '/gallery')
    await page.screenshot({ path: 'e2e/screenshots/gallery-all-photos.png', fullPage: true })

    const albumsBtn = page.locator('button', { hasText: /albums|相册/i }).first()
    if (await albumsBtn.isVisible()) {
      await albumsBtn.click()
      await page.waitForTimeout(300)
      await page.screenshot({ path: 'e2e/screenshots/gallery-albums.png', fullPage: true })
    }
  })

  test('Topics page renders', async ({ page }) => {
    await gotoPage(page, '/topics')
    await page.screenshot({ path: 'e2e/screenshots/topics-page.png', fullPage: true })
  })

  test('Courses page renders course catalog', async ({ page }) => {
    await gotoPage(page, '/courses')
    await page.screenshot({ path: 'e2e/screenshots/courses-catalog.png', fullPage: true })
  })

  test('Membership page renders tiers', async ({ page }) => {
    await gotoPage(page, '/membership')
    await page.screenshot({ path: 'e2e/screenshots/membership-page.png', fullPage: true })
  })

  test('Shop page renders products', async ({ page }) => {
    await gotoPage(page, '/shop')
    await page.screenshot({ path: 'e2e/screenshots/shop-page.png', fullPage: true })
  })

  test('Discover page renders', async ({ page }) => {
    await gotoPage(page, '/discover')
    await page.screenshot({ path: 'e2e/screenshots/discover-page.png', fullPage: true })
  })
})

test.describe('Business Pages — Visual Verification', () => {
  test.use({ colorScheme: 'dark' })

  test('Creator Studio renders with theme/layout/tabs editor', async ({ page }) => {
    await gotoPage(page, '/business/creator-studio')
    await page.screenshot({ path: 'e2e/screenshots/creator-studio.png', fullPage: true })
  })

  test('Course Editor renders with modules and lessons', async ({ page }) => {
    await gotoPage(page, '/business/course-editor')
    await page.screenshot({ path: 'e2e/screenshots/course-editor.png', fullPage: true })

    const previewBtn = page.locator('button', { hasText: /preview|预览/i }).first()
    if (await previewBtn.isVisible()) {
      await previewBtn.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: 'e2e/screenshots/course-editor-preview.png', fullPage: true })
    }
  })
})

test.describe('Light Mode — Visual Verification', () => {
  test.use({ colorScheme: 'light' })

  test('Feed page in light mode', async ({ page }) => {
    await gotoPage(page, '/feed')
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    })
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'e2e/screenshots/feed-light-mode.png', fullPage: true })
  })

  test('Gallery page in light mode', async ({ page }) => {
    await gotoPage(page, '/gallery')
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    })
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'e2e/screenshots/gallery-light-mode.png', fullPage: true })
  })

  test('Courses page in light mode', async ({ page }) => {
    await gotoPage(page, '/courses')
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    })
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'e2e/screenshots/courses-light-mode.png', fullPage: true })
  })
})

test.describe('Mobile Viewport — Visual Verification', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'dark' })

  test('Feed page on mobile', async ({ page }) => {
    await gotoPage(page, '/feed')
    await page.screenshot({ path: 'e2e/screenshots/feed-mobile.png', fullPage: true })
  })

  test('Gallery page on mobile', async ({ page }) => {
    await gotoPage(page, '/gallery')
    await page.screenshot({ path: 'e2e/screenshots/gallery-mobile.png', fullPage: true })
  })

  test('Courses page on mobile', async ({ page }) => {
    await gotoPage(page, '/courses')
    await page.screenshot({ path: 'e2e/screenshots/courses-mobile.png', fullPage: true })
  })
})
