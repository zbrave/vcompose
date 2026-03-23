import { test, expect } from '@playwright/test';

test('node persists after page reload', async ({ page }) => {
  await page.goto('/app');
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
  await page.waitForSelector('.react-flow');

  // Open marketplace panel and add a node
  await page.click('[data-testid="rail-marketplace"]');
  const sidebar = page.locator('text=postgres:16-alpine').first();
  const canvas = page.locator('.react-flow');
  await sidebar.dragTo(canvas, { targetPosition: { x: 300, y: 200 } });

  // Verify node exists
  const node = page.locator('.react-flow__node');
  await expect(node).toBeVisible();

  // Reload the page (WITHOUT clearing localStorage)
  await page.reload();
  await page.waitForSelector('.react-flow');

  // Node should still be there
  const nodeAfterReload = page.locator('.react-flow__node');
  await expect(nodeAfterReload).toBeVisible();
  await expect(nodeAfterReload).toContainText('postgres');
});
