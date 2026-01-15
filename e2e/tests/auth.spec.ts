import { test, expect } from '@playwright/test'

/**
 * Authentication flow E2E tests.
 */
test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')

    await expect(page).toHaveTitle(/Argos/)
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible()
  })

  test('should show validation error for empty form', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('button', { name: /se connecter/i }).click()

    // Should show validation or stay on login page
    await expect(page).toHaveURL(/login/)
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard')

    // Should redirect to login
    await expect(page).toHaveURL(/login/)
  })

  test('should display register page', async ({ page }) => {
    await page.goto('/register')

    await expect(page.getByRole('heading', { name: /créer un compte/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login')

    // Click link to register
    await page.getByRole('link', { name: /créer un compte/i }).click()
    await expect(page).toHaveURL(/register/)

    // Click link back to login
    await page.getByRole('link', { name: /se connecter/i }).click()
    await expect(page).toHaveURL(/login/)
  })
})
