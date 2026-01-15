import { test, expect } from '@playwright/test'

/**
 * Search functionality E2E tests.
 */
test.describe('Search Page', () => {
  test.skip('should display search page when authenticated', async ({ page }) => {
    // TODO: Add auth fixture
    await page.goto('/search')

    await expect(page.getByRole('heading', { name: /recherche/i })).toBeVisible()
    await expect(page.getByPlaceholder(/rechercher/i)).toBeVisible()
  })

  test.skip('should show empty state when no query', async ({ page }) => {
    // TODO: Add auth fixture
    await page.goto('/search')

    await expect(page.getByText(/tapez un mot-clé/i)).toBeVisible()
  })

  test.skip('should update URL with search query', async ({ page }) => {
    // TODO: Add auth fixture
    await page.goto('/search')

    await page.getByPlaceholder(/rechercher/i).fill('python')

    // Wait for debounce
    await page.waitForTimeout(500)

    await expect(page).toHaveURL(/q=python/)
  })

  test.skip('should show no results message for unknown query', async ({ page }) => {
    // TODO: Add auth fixture
    await page.goto('/search?q=xyznonexistent123')

    await expect(page.getByText(/aucun résultat/i)).toBeVisible()
  })
})
