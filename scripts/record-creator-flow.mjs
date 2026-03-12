/**
 * Playwright script to record a creator flow:
 * Login → Business dashboard → Experiences → Add experience → Save → Products → Home editor
 */
import { chromium } from 'playwright'

const BASE = 'https://internal-demo.olu.tech'
const EMAIL = 'luna.demo@olu.app'
const PASSWORD = 'Demo123!'

async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

;(async () => {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: './recordings/', size: { width: 1280, height: 800 } },
    colorScheme: 'dark',
  })
  const page = await context.newPage()

  // 1. Login as creator
  console.log('Step 1: Login as Creator (Luna)')
  await page.goto(`${BASE}/login`)
  await page.waitForSelector('input[name="email"]', { timeout: 15000 })
  await delay(1000)
  await page.fill('input[name="email"]', EMAIL)
  await page.fill('input[name="password"]', PASSWORD)
  await delay(500)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/', { timeout: 15000 })
  await delay(2000)

  // 2. Navigate to business dashboard
  console.log('Step 2: Business dashboard')
  await page.goto(`${BASE}/business`)
  await page.waitForLoadState('networkidle')
  await delay(3000)

  // 3. Go to Experiences
  console.log('Step 3: Experiences page')
  await page.goto(`${BASE}/business/experiences`)
  await page.waitForLoadState('networkidle')
  await delay(3000)

  // 4. Click "New Experience" or similar button
  console.log('Step 4: Create new experience')
  const newExpBtn = page.locator('button:has-text("New"), button:has-text("Add"), button:has-text("Create")').first()
  if (await newExpBtn.isVisible()) {
    await newExpBtn.click()
    await delay(2000)
  }

  // Fill in experience details if a form appears
  const nameInput = page.locator('input[placeholder*="name"], input[placeholder*="Name"], input[name="name"]').first()
  if (await nameInput.isVisible()) {
    await nameInput.fill('Exclusive Masterclass')
    await delay(500)
  }

  // Select experience type if dropdown exists
  const typeSelect = page.locator('select, [role="combobox"]').first()
  if (await typeSelect.isVisible()) {
    await typeSelect.click()
    await delay(500)
    const courseOption = page.locator('text=Course, text=course').first()
    if (await courseOption.isVisible()) {
      await courseOption.click()
      await delay(500)
    }
  }

  // Save
  const saveBtn = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first()
  if (await saveBtn.isVisible()) {
    await saveBtn.click()
    await delay(2000)
  }

  // 5. View the experiences list
  console.log('Step 5: View experiences list')
  await page.waitForLoadState('networkidle')
  await delay(2000)

  // Scroll through the list
  await page.evaluate(() => window.scrollBy(0, 300))
  await delay(1500)
  await page.evaluate(() => window.scrollBy(0, -300))
  await delay(1000)

  // 6. Go to Products page
  console.log('Step 6: Products page')
  await page.goto(`${BASE}/business/products`)
  await page.waitForLoadState('networkidle')
  await delay(3000)

  // Scroll to see products
  await page.evaluate(() => window.scrollBy(0, 400))
  await delay(2000)
  await page.evaluate(() => window.scrollBy(0, -400))
  await delay(1000)

  // 7. Go to Home Editor
  console.log('Step 7: Home editor')
  await page.goto(`${BASE}/business/home-editor`)
  await page.waitForLoadState('networkidle')
  await delay(3000)

  // Scroll through the editor
  await page.evaluate(() => window.scrollBy(0, 300))
  await delay(2000)

  // 8. Go to Team page
  console.log('Step 8: Team page')
  await page.goto(`${BASE}/business/team`)
  await page.waitForLoadState('networkidle')
  await delay(3000)

  // 9. Back to dashboard
  console.log('Step 9: Back to dashboard')
  await page.goto(`${BASE}/business`)
  await delay(3000)

  // Done
  console.log('Recording complete!')
  await delay(1000)
  await context.close()
  await browser.close()

  console.log('Video saved to ./recordings/')
})()
