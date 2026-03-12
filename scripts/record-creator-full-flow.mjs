/**
 * Playwright: Full Creator workflow
 * Login → Experiences → Create Forum → Configure → Create Course → Add chapters/lessons/YouTube → Products → Create product → Link experiences → Add plans → Consumer verify
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

  // ── 1. Login ──
  console.log('Step 1: Login as Creator (Luna)')
  await page.goto(`${BASE}/login`)
  await page.waitForSelector('input[name="email"]', { timeout: 15000 })
  await delay(800)
  await page.fill('input[name="email"]', EMAIL)
  await page.fill('input[name="password"]', PASSWORD)
  await delay(400)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/', { timeout: 15000 })
  await delay(2000)

  // ── 2. Navigate to Business → Experiences ──
  console.log('Step 2: Go to Experiences')
  await page.goto(`${BASE}/business/experiences`)
  await page.waitForLoadState('networkidle')
  await delay(2000)

  // ── 3. Create Forum Experience ──
  console.log('Step 3: Create Forum experience')
  // Click the Add button
  const addBtn = page.locator('button').filter({ hasText: /Add|New|\+/ }).first()
  if (await addBtn.isVisible()) {
    await addBtn.click()
    await delay(1000)
  }

  // Select Forum type
  const forumTypeBtn = page.locator('button').filter({ hasText: 'Forum' }).first()
  if (await forumTypeBtn.isVisible()) {
    await forumTypeBtn.click()
    await delay(500)
  }

  // Fill name
  const nameInput = page.locator('input').filter({ hasText: '' }).last()
  await nameInput.fill('Fan Lounge')
  await delay(500)

  // Set visibility to Public (should be default)
  const publicBtn = page.locator('button').filter({ hasText: 'Public' }).first()
  if (await publicBtn.isVisible()) {
    await publicBtn.click()
    await delay(300)
  }

  // Click Create
  const createForumBtn = page.locator('button').filter({ hasText: 'Create Forum' }).first()
  if (await createForumBtn.isVisible()) {
    await createForumBtn.click()
    await delay(2000)
  }

  // ── 4. Configure Forum ──
  console.log('Step 4: Configure Forum')
  // Click on the forum card to go to ForumEditor
  const forumCard = page.locator('text=Fan Lounge').first()
  if (await forumCard.isVisible()) {
    // Look for a clickable parent or the chevron
    const chevron = forumCard.locator('..').locator('..').locator('svg').last()
    await chevron.click({ timeout: 3000 }).catch(async () => {
      await forumCard.click()
    })
    await delay(2000)
  }

  // On ForumEditor page
  await page.waitForLoadState('networkidle')
  await delay(1500)

  // Select "Everyone" can post (first option)
  const everyonePost = page.locator('button').filter({ hasText: 'Everyone' }).first()
  if (await everyonePost.isVisible()) {
    await everyonePost.click()
    await delay(500)
  }

  // Select "Everyone" can comment
  const everyoneComment = page.locator('button').filter({ hasText: 'Everyone' }).nth(1)
  if (await everyoneComment.isVisible()) {
    await everyoneComment.click()
    await delay(500)
  }

  // Click Done/Save
  const doneBtn = page.locator('button').filter({ hasText: /Done|Save/ }).first()
  if (await doneBtn.isVisible()) {
    await doneBtn.click()
    await delay(2000)
  }

  // ── 5. Go back to Experiences, Create Course ──
  console.log('Step 5: Create Course experience')
  await page.goto(`${BASE}/business/experiences`)
  await page.waitForLoadState('networkidle')
  await delay(1500)

  // Click Add button again
  const addBtn2 = page.locator('button').filter({ hasText: /Add|New|\+/ }).first()
  if (await addBtn2.isVisible()) {
    await addBtn2.click()
    await delay(1000)
  }

  // Select Course type
  const courseTypeBtn = page.locator('button').filter({ hasText: 'Course' }).first()
  if (await courseTypeBtn.isVisible()) {
    await courseTypeBtn.click()
    await delay(500)
  }

  // Fill name
  const nameInput2 = page.locator('input').filter({ hasText: '' }).last()
  await nameInput2.fill('Digital Art Fundamentals')
  await delay(500)

  // Set visibility to Product gated
  const gatedBtn = page.locator('button').filter({ hasText: 'Product gated' }).first()
  if (await gatedBtn.isVisible()) {
    await gatedBtn.click()
    await delay(300)
  }

  // Click Create
  const createCourseBtn = page.locator('button').filter({ hasText: 'Create Course' }).first()
  if (await createCourseBtn.isVisible()) {
    await createCourseBtn.click()
    await delay(2000)
  }

  // ── 6. Enter Course Editor ──
  console.log('Step 6: Enter Course Editor')
  const courseCard = page.locator('text=Digital Art Fundamentals').first()
  if (await courseCard.isVisible()) {
    const chevron2 = courseCard.locator('..').locator('..').locator('svg').last()
    await chevron2.click({ timeout: 3000 }).catch(async () => {
      await courseCard.click()
    })
    await delay(2000)
  }
  await page.waitForLoadState('networkidle')
  await delay(1500)

  // Click Add Course card
  const addCourseBtn = page.locator('text=Add course').first()
  if (await addCourseBtn.isVisible()) {
    await addCourseBtn.click()
    await delay(800)
  }

  // Fill course name
  const courseNameInput = page.locator('input[placeholder="Course name"]').first()
  if (await courseNameInput.isVisible()) {
    await courseNameInput.fill('Getting Started with Digital Art')
    await delay(300)
    // Press Enter or click Create
    const createBtn = page.locator('button').filter({ hasText: 'Create' }).first()
    if (await createBtn.isVisible()) {
      await createBtn.click()
    } else {
      await courseNameInput.press('Enter')
    }
    await delay(2000)
  }

  // ── 7. Click into the course to edit ──
  console.log('Step 7: Edit course - add chapters and lessons')
  const courseItem = page.locator('text=Getting Started with Digital Art').first()
  if (await courseItem.isVisible()) {
    await courseItem.click()
    await delay(2000)
  }
  await page.waitForLoadState('networkidle')
  await delay(1000)

  // Add first chapter
  const addChapterBtn = page.locator('button').filter({ hasText: /Add.*chapter/ }).first()
  if (await addChapterBtn.isVisible()) {
    await addChapterBtn.click()
    await delay(1000)
  }

  // The chapter title may be editable inline - try to find and edit it
  const chapterTitle = page.locator('input, [contenteditable]').filter({ hasText: '' }).first()
  // Try clicking on "Chapter 1" or similar default text
  const defaultChapter = page.locator('text=Chapter 1, text=New Chapter, text=Untitled').first()
  if (await defaultChapter.isVisible()) {
    await defaultChapter.dblclick()
    await delay(500)
  }

  // Add a lesson to the chapter
  await delay(1000)
  const addLessonBtn = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: '' }).first()
  // Try hovering over the chapter to reveal the add lesson button
  const chapterSection = page.locator('[class*="border"]').filter({ hasText: /Chapter|New/ }).first()
  if (await chapterSection.isVisible()) {
    await chapterSection.hover()
    await delay(500)
  }

  // Look for Plus button for adding lesson
  const plusBtns = page.locator('button:has(svg)').all()
  for (const btn of await plusBtns) {
    const text = await btn.textContent()
    if (!text || text.trim() === '') {
      // Could be a plus icon button
    }
  }

  // Try finding add lesson more specifically
  const addLessonBtns = page.locator('button').filter({ hasText: /lesson|Lesson/ })
  if (await addLessonBtns.count() > 0) {
    await addLessonBtns.first().click()
    await delay(1000)
  }

  // Select the lesson in the sidebar to edit
  await delay(1000)
  const lessonItem = page.locator('button').filter({ hasText: /Lesson|Untitled|New/ }).first()
  if (await lessonItem.isVisible()) {
    await lessonItem.click()
    await delay(1000)
  }

  // Fill lesson title
  const lessonTitleInput = page.locator('input').first()
  if (await lessonTitleInput.isVisible()) {
    await lessonTitleInput.fill('Introduction to Digital Art Tools')
    await delay(500)
  }

  // Fill video URL
  const videoInput = page.locator('input[placeholder*="youtube"], input[type="url"]').first()
  if (await videoInput.isVisible()) {
    await videoInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    await delay(500)
    await videoInput.press('Enter')
    await delay(1500)
  }

  // Fill content
  const contentArea = page.locator('textarea').first()
  if (await contentArea.isVisible()) {
    await contentArea.fill('In this lesson, we cover the essential tools every digital artist needs. From stylus tablets to software selection, you will learn how to set up your creative workspace.')
    await delay(500)
  }

  // Save
  const saveBtn = page.locator('button').filter({ hasText: 'Save' }).first()
  if (await saveBtn.isVisible()) {
    await saveBtn.click()
    await delay(2000)
  }

  // Scroll to see the content
  await page.evaluate(() => window.scrollBy(0, 300))
  await delay(2000)

  // ── 8. Go to Products page ──
  console.log('Step 8: Create Product')
  await page.goto(`${BASE}/business/products`)
  await page.waitForLoadState('networkidle')
  await delay(2000)

  // Click Add button
  const addProdBtn = page.locator('button').filter({ hasText: /Add|New|\+/ }).first()
  if (await addProdBtn.isVisible()) {
    await addProdBtn.click()
    await delay(1000)
  }

  // Fill product name
  const prodNameInput = page.locator('input[placeholder*="Membership"], input[placeholder*="name"]').first()
  if (await prodNameInput.isVisible()) {
    await prodNameInput.fill('Pro Access')
    await delay(500)
  }

  // Fill description
  const prodDescInput = page.locator('input[placeholder*="access"], input[placeholder*="description"]').first()
  if (await prodDescInput.isVisible()) {
    await prodDescInput.fill('Full access to all courses and community content')
    await delay(500)
  }

  // Select Paid
  const paidBtn = page.locator('button').filter({ hasText: 'Paid' }).first()
  if (await paidBtn.isVisible()) {
    await paidBtn.click()
    await delay(300)
  }

  // Click Create Product
  const createProdBtn = page.locator('button').filter({ hasText: 'Create Product' }).first()
  if (await createProdBtn.isVisible()) {
    await createProdBtn.click()
    await delay(2000)
  }

  // ── 9. Expand product card and add plans ──
  console.log('Step 9: Add pricing plans')
  await page.waitForLoadState('networkidle')
  await delay(1000)

  // Find the product card and expand it
  const productCard = page.locator('text=Pro Access').first()
  if (await productCard.isVisible()) {
    // Click expand chevron
    const expandBtn = productCard.locator('..').locator('..').locator('button').last()
    await expandBtn.click().catch(async () => {
      await productCard.click()
    })
    await delay(1500)
  }

  // Add monthly plan: $9.99/month
  const priceInput = page.locator('input[placeholder*="9.99"], input[type="number"]').first()
  if (await priceInput.isVisible()) {
    await priceInput.fill('9.99')
    await delay(300)

    // Select Monthly interval
    const intervalSelect = page.locator('select').filter({ hasText: /Monthly|Weekly|Yearly/ }).first()
    if (await intervalSelect.isVisible()) {
      await intervalSelect.selectOption('month')
      await delay(300)
    }

    // Click Add plan button
    const addPlanBtn = page.locator('button').filter({ hasText: 'Add' }).first()
    if (await addPlanBtn.isVisible()) {
      await addPlanBtn.click()
      await delay(1500)
    }
  }

  // Add 6-month plan: $49.99 (one-time / or yearly at different price)
  // Actually add yearly plan: $89.99/year
  const priceInput2 = page.locator('input[placeholder*="9.99"], input[type="number"]').first()
  if (await priceInput2.isVisible()) {
    await priceInput2.fill('89.99')
    await delay(300)

    const intervalSelect2 = page.locator('select').filter({ hasText: /Monthly|Weekly|Yearly/ }).first()
    if (await intervalSelect2.isVisible()) {
      await intervalSelect2.selectOption('year')
      await delay(300)
    }

    const addPlanBtn2 = page.locator('button').filter({ hasText: 'Add' }).first()
    if (await addPlanBtn2.isVisible()) {
      await addPlanBtn2.click()
      await delay(1500)
    }
  }

  // ── 10. Link experiences to product ──
  console.log('Step 10: Link experiences to product')
  // Look for "Link experience" buttons
  const linkBtns = page.locator('button').filter({ hasText: /Fan Lounge|Digital Art/ })
  const linkCount = await linkBtns.count()
  for (let i = 0; i < Math.min(linkCount, 2); i++) {
    await linkBtns.nth(i).click()
    await delay(1000)
  }

  await delay(2000)

  // Scroll to see everything
  await page.evaluate(() => window.scrollTo(0, 0))
  await delay(1000)
  await page.evaluate(() => window.scrollBy(0, 500))
  await delay(2000)

  // ── 11. Switch to Consumer to verify ──
  console.log('Step 11: Verify on Consumer side')
  await page.goto(`${BASE}/w/lunachen-workspace`)
  await page.waitForLoadState('networkidle')
  await delay(3000)

  // Browse tabs
  const tabs = page.locator('button.rounded-full')
  const tabCount = await tabs.count()
  for (let i = 0; i < Math.min(tabCount, 4); i++) {
    await tabs.nth(i).click()
    await delay(1500)
  }

  // Go to About tab
  const aboutTab = page.locator('button').filter({ hasText: 'About' }).first()
  if (await aboutTab.isVisible()) {
    await aboutTab.click()
    await delay(2000)
  }

  // Scroll to see products
  await page.evaluate(() => window.scrollBy(0, 300))
  await delay(2000)

  // Done
  console.log('Recording complete!')
  await delay(1000)
  await context.close()
  await browser.close()

  console.log('Video saved to ./recordings/')
})()
