import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.react-flow');
});

test('add a network from sidebar', async ({ page }) => {
  // Type network name and click add
  await page.locator('input[placeholder="network name"]').fill('frontend');
  await page.locator('[data-testid="add-network-btn"]').click();

  // Network should appear in the list
  await expect(page.locator('input[value="frontend"]')).toBeVisible();
});

test('network appears in config panel as checkbox', async ({ page }) => {
  // Add a network first
  await page.locator('input[placeholder="network name"]').fill('backend');
  await page.locator('[data-testid="add-network-btn"]').click();

  // Add a node
  const sidebar = page.locator('text=Nginx');
  const canvas = page.locator('.react-flow');
  await sidebar.dragTo(canvas, { targetPosition: { x: 300, y: 200 } });

  // Click the node to open config
  const node = page.locator('.react-flow__node').first();
  await node.click();

  // Should see backend checkbox in config panel
  await expect(page.locator('label:has-text("backend")')).toBeVisible();
});

test('network appears in YAML when assigned to service', async ({ page }) => {
  // Add a network
  await page.locator('input[placeholder="network name"]').fill('mynet');
  await page.locator('[data-testid="add-network-btn"]').click();

  // Add a node
  const sidebar = page.locator('text=Nginx');
  const canvas = page.locator('.react-flow');
  await sidebar.dragTo(canvas, { targetPosition: { x: 300, y: 200 } });

  // Click the node
  const node = page.locator('.react-flow__node').first();
  await node.click();

  // Check the network checkbox
  await page.locator('label:has-text("mynet") input[type="checkbox"]').check();

  // YAML should contain the network
  const yaml = page.locator('pre');
  await expect(yaml).toContainText('mynet');
});
