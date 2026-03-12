/**
 * Playwright script to record a consumer user flow:
 * Login → Discover → Browse workspace → View course with YouTube → Try gated content → Product page → Purchase
 */
import { chromium } from 'playwright'

const BASE = 'https://internal-demo.olu.tech'
const EMAIL = 'alex.demo@olu.app'
const PASSWORD = 'Demo123!'

async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

;(async () => {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: { dir: './recordings/', size: { width: 390, height: 844 } },
    colorScheme: 'dark',
  })
  const page = await context.newPage()

  // 1. Login
  console.log('Step 1: Login')
  await page.goto(`${BASE}/login`)
  await page.waitForSelector('input[name="email"]', { timeout: 15000 })
  await delay(1000)
  await page.fill('input[name="email"]', EMAIL)
  await page.fill('input[name="password"]', PASSWORD)
  await delay(500)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/', { timeout: 15000 })
  await delay(2000)

  // 2. Go to Discover
  console.log('Step 2: Discover page')
  await page.goto(`${BASE}/discover`)
  await page.waitForLoadState('networkidle')
  await delay(3000)

  // 3. Click on a workspace (FitLife Academy)
  console.log('Step 3: Browse workspace')
  const workspaceCard = page.locator('text=FitLife Academy').first()
  if (await workspaceCard.isVisible()) {
    await workspaceCard.click()
  } else {
    await page.goto(`${BASE}/w/coachmika-workspace`)
  }
  await page.waitForLoadState('networkidle')
  await delay(3000)

  // 4. Click Join workspace button if visible
  console.log('Step 4: Join workspace')
  const joinBtn = page.locator('button:has-text("Join")').first()
  if (await joinBtn.isVisible()) {
    await joinBtn.click()
    await delay(2000)
  }

  // 5. Browse tabs
  console.log('Step 5: Browse tabs')
  const tabs = page.locator('button.rounded-full')
  const tabCount = await tabs.count()
  for (let i = 1; i < Math.min(tabCount, 4); i++) {
    await tabs.nth(i).click()
    await delay(1500)
  }

  // 6. Click on a course experience
  console.log('Step 6: Open a course')
  // Go back to a tab that has courses
  const learnTab = page.locator('button:has-text("Learn")').first()
  if (await learnTab.isVisible()) {
    await learnTab.click()
    await delay(1000)
  }
  // Find and click a course card
  const courseCard = page.locator('text=Course').first()
  if (await courseCard.isVisible()) {
    await courseCard.click()
    await delay(2000)
  }
  await page.waitForLoadState('networkidle')
  await delay(3000)

  // 7. Interact with course - click on chapters/lessons
  console.log('Step 7: Browse course lessons')
  // Click on a chapter to expand
  const chapterBtn = page.locator('button:has(svg)').filter({ hasText: /.+/ }).first()
  if (await chapterBtn.isVisible()) {
    await chapterBtn.click()
    await delay(1000)
  }
  // Click on a lesson
  const lessonBtn = page.locator('button:has(.rounded-full)').nth(1)
  if (await lessonBtn.isVisible()) {
    await lessonBtn.click()
    await delay(3000)
  }

  // 8. Go back to workspace and try a gated experience
  console.log('Step 8: Try gated experience')
  await page.goBack()
  await delay(1000)
  await page.goBack()
  await delay(2000)

  // Click on a gated (locked) experience
  const gatedItem = page.locator('text=Gated').first()
  if (await gatedItem.isVisible()) {
    const card = gatedItem.locator('..')
    await card.click()
    await delay(2000)
  }

  // 9. If redirected to product page, interact with it
  console.log('Step 9: Product detail page')
  await page.waitForLoadState('networkidle')
  await delay(2000)

  // Scroll down to see plans
  await page.evaluate(() => window.scrollBy(0, 300))
  await delay(1500)

  // Select a plan if available
  const planCard = page.locator('button:has-text("$")').first()
  if (await planCard.isVisible()) {
    await planCard.click()
    await delay(1000)
  }

  // Click Get Access button
  const getAccess = page.locator('button:has-text("Get Access")').first()
  if (await getAccess.isVisible()) {
    await getAccess.click()
    await delay(2000)
  }

  // 10. Go to home
  console.log('Step 10: Back to home')
  await page.goto(`${BASE}/`)
  await delay(3000)

  // Done
  console.log('Recording complete!')
  await delay(1000)
  await context.close()
  await browser.close()

  console.log('Video saved to ./recordings/')
})()
