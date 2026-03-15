import { test, expect } from '@playwright/test';

test.describe('Stacks Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.setItem('vdc-entered', '1');
    });
    await page.reload();
    await page.waitForSelector('.react-flow');
    // Click Stacks tab
    await page.click('button:text("Stacks")');
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
    await page.click('button:text("+ Add Stack")');
    // Verify 3 nodes appear on canvas
    const nodes = page.locator('.react-flow__node');
    await expect(nodes).toHaveCount(3);
  });
});
