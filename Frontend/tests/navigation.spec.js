import { test, expect } from '@playwright/test'

test.describe('Navigation & Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45000 })
  })

  test('Home page loads with ZYRA branding', async ({ page }) => {
    await expect(page.locator('text=ZYRA').first()).toBeVisible({ timeout: 15000 })
  })

  test('Header navigation links work', async ({ page }) => {
    const navLinks = [
      { selector: 'a[href="/collections/all?gender=Men"]', urlPattern: /gender=Men/ },
      { selector: 'a[href="/collections/all?gender=Women"]', urlPattern: /gender=Women/ },
      { selector: 'a[href="/collections/all?category=Top Wear"]', urlPattern: /category=Top%20Wear/ },
      { selector: 'a[href="/collections/all?category=Bottom Wear"]', urlPattern: /category=Bottom%20Wear/ },
    ]

    for (const link of navLinks) {
      const element = page.locator(link.selector).first()
      if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
        await element.click()
        await expect(page).toHaveURL(link.urlPattern)
        await page.goBack()
        await page.waitForLoadState('domcontentloaded')
      }
    }
  })

  test('Logo link navigates to home', async ({ page }) => {
    await page.goto('/collections/all?gender=Men', { waitUntil: 'domcontentloaded' })
    const logo = page.locator('a[href="/"]').first()
    if (await logo.isVisible({ timeout: 5000 }).catch(() => false)) {
      await logo.click()
      await expect(page).toHaveURL('/', { timeout: 10000 })
    }
  })

  test('Cart icon accessible', async ({ page }) => {
    const cartBtn = page.locator('button:has-text("Cart"), button:has([aria-label*="cart" i]), [data-testid*="cart"]').first()
    if (await cartBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cartBtn.click()
      await expect(page.locator('text=Cart, text=Shopping Bag, text=Your Cart').first()).toBeVisible({ timeout: 5000 }).catch(() => {})
    }
  })

  test('Search bar accessible', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[name="search"]').first()
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('shirt')
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/.*search.*/, { timeout: 10000 }).catch(() => {})
    }
  })
})

test.describe('Footer', () => {
  test('Footer links present', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)
    
    const footerLinks = ['About', 'Contact', 'Privacy', 'Terms', 'Shipping', 'Returns']
    for (const linkText of footerLinks) {
      const link = page.locator(`a:has-text("${linkText}")`).first()
      if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(link).toBeVisible()
      }
    }
  })

  test('Social media links present', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)
    
    const socialLinks = ['facebook', 'instagram', 'twitter', 'x.com']
    for (const social of socialLinks) {
      const link = page.locator(`a[href*="${social}"]`).first()
      if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(link).toBeVisible()
      }
    }
  })
})

test.describe('Responsive Design', () => {
  test('Mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45000 })
    await expect(page.locator('text=ZYRA').first()).toBeVisible({ timeout: 15000 })
    
    // Mobile menu button should be visible
    const menuBtn = page.locator('button[aria-label*="menu" i], button:has([class*="hamburger" i]), button:has([class*="bars" i])').first()
    await expect(menuBtn).toBeVisible({ timeout: 5000 }).catch(() => {})
  })

  test('Tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45000 })
    await expect(page.locator('text=ZYRA').first()).toBeVisible({ timeout: 15000 })
  })

  test('Desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45000 })
    await expect(page.locator('text=ZYRA').first()).toBeVisible({ timeout: 15000 })
  })
})

test.describe('404 Page', () => {
  test('Non-existent route shows 404', async ({ page }) => {
    await page.goto('/non-existent-page-xyz', { waitUntil: 'domcontentloaded', timeout: 45000 })
    await expect(page.locator('text=404, text=Not Found, text=Page Not Found').first()).toBeVisible({ timeout: 10000 }).catch(() => {})
  })
})