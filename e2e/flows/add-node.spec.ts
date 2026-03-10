import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.react-flow');
});

test('drag nginx preset from sidebar to canvas creates a node', async ({ page }) => {
  const sidebar = page.locator('text=Nginx');
  const canvas = page.locator('.react-flow');

  // Drag from sidebar to canvas
  await sidebar.dragTo(canvas, { targetPosition: { x: 300, y: 200 } });

  // Node should appear on canvas
  const node = page.locator('.react-flow__node');
  await expect(node).toBeVisible();

  // Should contain nginx default values
  await expect(node).toContainText('nginx');
});

test('drag custom preset creates a node with empty image', async ({ page }) => {
  const sidebar = page.locator('text=Custom');
  const canvas = page.locator('.react-flow');

  await sidebar.dragTo(canvas, { targetPosition: { x: 300, y: 200 } });

  const node = page.locator('.react-flow__node');
  await expect(node).toBeVisible();
  await expect(node).toContainText('no image');
});
