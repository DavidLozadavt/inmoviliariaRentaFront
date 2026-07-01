// src/tests/e2e/login.e2e.ts
import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Login → Home flow.
 * Run with: npx playwright test
 * Requires the dev server to be running: npm run dev
 */

test.describe('Login Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Clear any existing auth state
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    });

    test('shows the login form', async ({ page }) => {
        await page.goto('/login');
        await expect(page.getByRole('heading', { name: /accede a tu cuenta/i })).toBeVisible();
        await expect(page.getByLabel(/correo electrónico/i)).toBeVisible();
        await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    });

    test('shows validation errors on empty submit', async ({ page }) => {
        await page.goto('/login');
        await page.getByRole('button', { name: /iniciar sesión/i }).click();
        await expect(page.getByText(/obligatorio/i).first()).toBeVisible();
    });

    test('shows error on invalid credentials', async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel(/correo electrónico/i).fill('invalid@test.com');
        await page.getByLabel(/contraseña/i).fill('wrongpassword');
        await page.getByRole('button', { name: /iniciar sesión/i }).click();
        await expect(page.getByRole('alert')).toBeVisible();
    });

    test('navigates to home after successful login', async ({ page }) => {
        // Provide test credentials via environment variable
        const testEmail = process.env.E2E_TEST_EMAIL ?? 'test@rentusco.com';
        const testPassword = process.env.E2E_TEST_PASSWORD ?? 'password123';

        await page.goto('/login');
        await page.getByLabel(/correo electrónico/i).fill(testEmail);
        await page.getByLabel(/contraseña/i).fill(testPassword);
        await page.getByRole('button', { name: /iniciar sesión/i }).click();

        // Should land on home or admin dashboard
        await page.waitForURL((url) =>
            url.pathname === '/' || url.pathname.startsWith('/admin'),
            { timeout: 5000 });

        const pathname = new URL(page.url()).pathname;
        expect(['/', '/admin/dashboard']).toContain(pathname);
    });
});

test.describe('404 Not Found', () => {
    test('shows the 404 page for unknown routes', async ({ page }) => {
        await page.goto('/esta-ruta-no-existe-abc123');
        await expect(page.getByRole('heading', { name: /página no encontrada/i })).toBeVisible();
        await expect(page.getByText('404')).toBeVisible();
    });
});

test.describe('Property Listing', () => {
    test('shows properties on the home page', async ({ page }) => {
        await page.goto('/');
        // Wait for at least one property card to be rendered
        await expect(page.locator('[data-testid="property-card"]').first()).toBeVisible({
            timeout: 8000,
        });
    });
});
