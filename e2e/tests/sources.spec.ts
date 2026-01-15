import { test, expect } from '@playwright/test'

/**
 * Sources management E2E tests.
 * Note: These tests require authentication setup.
 */
test.describe('Sources Page', () => {
  test.skip('should display sources page when authenticated', async ({ page }) => {
    // TODO: Add auth fixture
    await page.goto('/sources')

    await expect(page.getByRole('heading', { name: /sources/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /add source/i })).toBeVisible()
  })

  test.skip('should show suggested sources section', async ({ page }) => {
    // TODO: Add auth fixture
    await page.goto('/sources')

    await expect(page.getByText(/sources suggérées/i)).toBeVisible()
  })

  test.skip('should open add source modal', async ({ page }) => {
    // TODO: Add auth fixture
    await page.goto('/sources')

    await page.getByRole('button', { name: /add source/i }).click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByLabel(/type/i)).toBeVisible()
    await expect(page.getByLabel(/url/i)).toBeVisible()
  })
})
