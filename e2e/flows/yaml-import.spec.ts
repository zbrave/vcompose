import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.setItem('vdc-entered', '1');
  });
  await page.reload();
  await page.waitForSelector('.react-flow');
});

test('import button opens modal', async ({ page }) => {
  await page.locator('[data-testid="import-btn"]').click();
  await expect(page.locator('text=Import docker-compose.yml')).toBeVisible();
});

test('import valid YAML creates nodes on canvas', async ({ page }) => {
  await page.locator('[data-testid="import-btn"]').click();

  const yaml = `services:\n  web:\n    image: nginx:alpine\n  db:\n    image: postgres:16`;

  await page.locator('textarea').fill(yaml);
  await page.locator('[data-testid="import-confirm-btn"]').click();

  // Click "Confirm Import" in the styled confirmation dialog
  await page.locator('button:text("Confirm Import")').click();

  // Modal should close
  await expect(page.locator('text=Import docker-compose.yml')).not.toBeVisible();

  // Two nodes should appear
  const nodes = page.locator('.react-flow__node');
  await expect(nodes).toHaveCount(2);
});

test('import invalid YAML shows error', async ({ page }) => {
  await page.locator('[data-testid="import-btn"]').click();
  await page.locator('textarea').fill('{{invalid yaml');
  await page.locator('[data-testid="import-confirm-btn"]').click();

  // Error should be visible
  await expect(page.getByText('Invalid YAML syntax', { exact: false })).toBeVisible();
});
