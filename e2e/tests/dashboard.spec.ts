import { test, expect } from '@playwright/test'

/**
 * Dashboard E2E tests.
 */
test.describe('Dashboard', () => {
  test.skip('should display dashboard when authenticated', async ({ page }) => {
    // TODO: Add auth fixture
    await page.goto('/dashboard')

    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test.skip('should show empty state when no articles', async ({ page }) => {
    // TODO: Add auth fixture with clean user
    await page.goto('/dashboard')

    await expect(page.getByText(/aucun article/i)).toBeVisible()
  })

  test.skip('should navigate to article detail', async ({ page }) => {
    // TODO: Add auth fixture with seeded articles
    await page.goto('/dashboard')

    // Click first article
    await page.locator('article').first().click()

    await expect(page).toHaveURL(/\/article\//)
  })

  test.skip('should navigate to sources page', async ({ page }) => {
    // TODO: Add auth fixture
    await page.goto('/dashboard')

    await page.getByRole('link', { name: /sources/i }).click()

    await expect(page).toHaveURL(/\/sources/)
  })

  test.skip('should navigate to search page', async ({ page }) => {
    // TODO: Add auth fixture
    await page.goto('/dashboard')

    await page.getByRole('link', { name: /recherche|search/i }).click()

    await expect(page).toHaveURL(/\/search/)
  })
})
