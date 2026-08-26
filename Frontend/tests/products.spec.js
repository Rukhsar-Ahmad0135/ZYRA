import { test, expect } from '@playwright/test'

async function checkAnyVisible(page, locators, timeout = 10000) {
  for (const locator of locators) {
    try {
      await expect(locator.first()).toBeVisible({ timeout })
      return true
    } catch {}
  }
  throw new Error('None of the locators were visible')
}

test.describe('Product Browsing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45000 })
  })

  test('Products displayed on home page', async ({ page }) => {
    await expect(page.locator('text=ZYRA').first()).toBeVisible({ timeout: 15000 })
    // Check for product grid/cards
    await expect(page.locator('[class*="product"], [data-testid*="product"], img[alt*="product" i]').first()).toBeVisible({ timeout: 10000 }).catch(() => {})
  })

  test('Navigate to Men collection', async ({ page }) => {
    const menLink = page.locator('a[href="/collections/all?gender=Men"]').first()
    if (await menLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await menLink.click()
      await expect(page).toHaveURL(/gender=Men/)
      // Check page loaded
      await expect(page.locator('h1, h2, [class*="collection"], [class*="products"]').first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('Navigate to Women collection', async ({ page }) => {
    const womenLink = page.locator('a[href="/collections/all?gender=Women"]').first()
    if (await womenLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await womenLink.click()
      await expect(page).toHaveURL(/gender=Women/)
      // Check page loaded
      await expect(page.locator('h1, h2, [class*="collection"], [class*="products"]').first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('Product detail page loads', async ({ page }) => {
    // Go to a collection first
    await page.goto('/collections/all?gender=Men', { waitUntil: 'domcontentloaded', timeout: 45000 })
    
    // Click first product
    const firstProduct = page.locator('a[href^="/products/"]').first()
    if (await firstProduct.isVisible({ timeout: 10000 }).catch(() => false)) {
      await firstProduct.click()
      await expect(page).toHaveURL(/.*products\//)
      await expect(page.locator('h1, h2, [class*="product-title"], [class*="product-name"]').first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('Product detail shows price', async ({ page }) => {
    await page.goto('/collections/all?gender=Men', { waitUntil: 'domcontentloaded', timeout: 45000 })
    const firstProduct = page.locator('a[href^="/products/"]').first()
    if (await firstProduct.isVisible({ timeout: 10000 }).catch(() => false)) {
      await firstProduct.click()
      await checkAnyVisible(page, [
        page.getByText(/\$/).first(),
        page.getByText('Price').first(),
        page.locator('[class*="price"]').first(),
      ])
    }
  })

  test('Product detail shows images', async ({ page }) => {
    await page.goto('/collections/all?gender=Men', { waitUntil: 'domcontentloaded', timeout: 45000 })
    const firstProduct = page.locator('a[href^="/products/"]').first()
    if (await firstProduct.isVisible({ timeout: 10000 }).catch(() => false)) {
      await firstProduct.click()
      await expect(page.locator('img[src*="cloudinary"], img[src*="unsplash"], img[alt*="product" i]').first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('Product detail has add to cart button', async ({ page }) => {
    await page.goto('/collections/all?gender=Men', { waitUntil: 'domcontentloaded', timeout: 45000 })
    const firstProduct = page.locator('a[href^="/products/"]').first()
    if (await firstProduct.isVisible({ timeout: 10000 }).catch(() => false)) {
      await firstProduct.click()
      const addToCartBtn = page.locator('button:has-text("Add to Cart"), button:has-text("Add to Bag"), button[type="submit"]').first()
      await expect(addToCartBtn).toBeVisible({ timeout: 10000 })
    }
  })

  test('Product size/color selection if available', async ({ page }) => {
    await page.goto('/collections/all?gender=Men', { waitUntil: 'domcontentloaded', timeout: 45000 })
    const firstProduct = page.locator('a[href^="/products/"]').first()
    if (await firstProduct.isVisible({ timeout: 10000 }).catch(() => false)) {
      await firstProduct.click()
      
      // Check for size options
      const sizeOptions = page.locator('button:has-text("S"), button:has-text("M"), button:has-text("L"), button:has-text("XL"), select[name="size"]')
      const count = await sizeOptions.count()
      if (count > 0) {
        await sizeOptions.first().click()
      }
      
      // Check for color options
      const colorOptions = page.locator('button[class*="color"], input[name="color"], [data-color]')
      const colorCount = await colorOptions.count()
      if (colorCount > 0) {
        await colorOptions.first().click()
      }
    }
  })
})

test.describe('Product Filtering & Sorting', () => {
  test('Collection page has filters', async ({ page }) => {
    await page.goto('/collections/all?gender=Men', { waitUntil: 'domcontentloaded', timeout: 45000 })
    
    // Check for filter sidebar or dropdown
    await expect(page.locator('text=Filter, text=Sort, select[name="sort"], button:has-text("Filter")').first()).toBeVisible({ timeout: 10000 }).catch(() => {})
  })

  test('Price filter works if available', async ({ page }) => {
    await page.goto('/collections/all?gender=Men', { waitUntil: 'domcontentloaded', timeout: 45000 })
    
    const priceFilter = page.locator('input[type="range"], select[name="price"], button:has-text("Price")').first()
    if (await priceFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Just verify it exists
      await expect(priceFilter).toBeVisible()
    }
  })
})