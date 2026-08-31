import { test, expect } from '@playwright/test'

test('home page loads', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45000 })
  await expect(page.locator('text=ZYRA').first()).toBeVisible({ timeout: 15000 })
})

test('navigate to login page directly', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 45000 })
  await expect(page).toHaveURL(/.*login/, { timeout: 15000 })
})

test('navigate to collections', async ({ page }) => {
  await page.goto('/collections/all?gender=Men', { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(/.*collections.*Men/)
})