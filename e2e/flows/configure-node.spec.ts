import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/app');
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
  await page.waitForSelector('.react-flow');

  // Open marketplace panel and add a node by dragging
  await page.click('[data-testid="rail-marketplace"]');
  const sidebar = page.locator('text=Nginx');
  const canvas = page.locator('.react-flow');
  await sidebar.dragTo(canvas, { targetPosition: { x: 300, y: 200 } });
});

test('clicking a node opens config panel', async ({ page }) => {
  const node = page.locator('.react-flow__node').first();
  await node.click();

  // Config panel should show "Configure" header
  await expect(page.locator('text=Configure')).toBeVisible();

  // Service name input should be visible
  await expect(page.getByText('Service Name')).toBeVisible();
});

test('changing service name updates YAML output', async ({ page }) => {
  const node = page.locator('.react-flow__node').first();
  await node.click();

  // Clear and type new service name — find the input after "Service Name" label
  const nameInput = page.locator('text=Service Name').locator('..').locator('input');
  await nameInput.fill('my-web');

  // YAML output should reflect the change
  const yaml = page.locator('pre');
  await expect(yaml).toContainText('my-web:');
});
