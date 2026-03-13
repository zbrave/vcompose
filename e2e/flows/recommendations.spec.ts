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

test('shows recommendations when a postgres node is selected', async ({ page }) => {
  const sidebar = page.locator('text=Postgres');
  const canvas = page.locator('.react-flow');

  await sidebar.dragTo(canvas, { targetPosition: { x: 300, y: 200 } });

  // Click the node to select it
  const node = page.locator('.react-flow__node').first();
  await node.click();

  // Recommendations section should appear
  await expect(page.locator('text=Recommended Services')).toBeVisible();
  await expect(page.locator('text=dpage/pgadmin4')).toBeVisible();
});

test('adds recommended service and creates edge', async ({ page }) => {
  const sidebar = page.locator('text=Postgres');
  const canvas = page.locator('.react-flow');

  await sidebar.dragTo(canvas, { targetPosition: { x: 300, y: 200 } });

  // Select the node
  const node = page.locator('.react-flow__node').first();
  await node.click();

  // Wait for recommendations to load
  await expect(page.locator('text=Recommended Services')).toBeVisible();

  // Click add on pgadmin recommendation
  const addBtn = page.locator('[data-testid="rec-add-pgadmin"]');
  await expect(addBtn).toBeVisible();
  await addBtn.click();

  // Wait briefly for state update
  await page.waitForTimeout(500);

  // Wait for the second node to appear
  await expect(page.locator('.react-flow__node')).toHaveCount(2, { timeout: 10000 });

  // Edge should also exist
  const edges = page.locator('.react-flow__edge');
  await expect(edges).toHaveCount(1, { timeout: 5000 });
});

test('shows "Added" for already-existing services', async ({ page }) => {
  const canvas = page.locator('.react-flow');

  // Add postgres node
  const postgres = page.locator('text=Postgres');
  await postgres.dragTo(canvas, { targetPosition: { x: 200, y: 200 } });

  // Select it and add pgadmin via recommendation
  const postgresNode = page.locator('.react-flow__node').first();
  await postgresNode.click();
  await expect(page.locator('text=Recommended Services')).toBeVisible();

  const addBtn = page.locator('[data-testid="rec-add-pgadmin"]');
  await addBtn.click();
  await page.waitForTimeout(500);

  // Re-select postgres node (click on canvas first to deselect, then click node)
  await postgresNode.click({ force: true });
  await page.waitForTimeout(300);

  // pgadmin recommendation should now show as "Added"
  await expect(page.locator('[data-testid="rec-add-pgadmin"]')).toHaveText('Added', { timeout: 5000 });
});
