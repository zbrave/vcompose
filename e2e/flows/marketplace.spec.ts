import { test, expect } from '@playwright/test';

test.describe('Marketplace Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await page.waitForSelector('.react-flow');
    await page.click('[data-testid="rail-marketplace"]');
  });

  test('shows category chips', async ({ page }) => {
    await expect(page.locator('button:text("All")')).toBeVisible();
    await expect(page.locator('button:text("Database")')).toBeVisible();
  });

  test('shows services from registry', async ({ page }) => {
    // Should show popular services by default
    await expect(page.locator('text=PostgreSQL').first()).toBeVisible();
  });

  test('category filter works', async ({ page }) => {
    await page.click('button:text("Cache")');
    await expect(page.locator('text=Redis').first()).toBeVisible();
  });
});
