import { test, expect } from '@playwright/test';

test.describe('Stacks Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await page.waitForSelector('.react-flow');
    // Stacks panel is the default — no need to click rail
  });

  test('shows stack list', async ({ page }) => {
    await expect(page.locator('text=Smart Home')).toBeVisible();
    await expect(page.locator('text=LEMP Stack')).toBeVisible();
  });

  test('search filters stacks', async ({ page }) => {
    await page.fill('input[placeholder*="Search stacks"]', 'media');
    await expect(page.locator('text=Media Server')).toBeVisible();
    await expect(page.locator('text=Smart Home')).not.toBeVisible();
  });

  test('clicking Add Stack adds services to canvas', async ({ page }) => {
    // Add ELK stack (3 services, smallest)
    await page.fill('input[placeholder*="Search stacks"]', 'ELK');
    await page.locator('button').filter({ hasText: 'Add Stack' }).first().click();
    // Verify 3 nodes appear on canvas
    const nodes = page.locator('.react-flow__node');
    await expect(nodes).toHaveCount(3);
  });
});
