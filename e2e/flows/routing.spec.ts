import { test, expect } from '@playwright/test';

test.describe('Routing & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('first visit shows landing page at /', async ({ page }) => {
    await page.reload();
    await expect(page.locator('text=Visual Docker Compose')).toBeVisible();
    await expect(page.locator('text=Start Building')).toBeVisible();
  });

  test('Start Building navigates to /app', async ({ page }) => {
    await page.reload();
    await page.click('text=Start Building');
    await expect(page).toHaveURL(/\/app$/);
    await page.waitForSelector('.react-flow');
  });

  test('returning visitor auto-redirects from / to /app', async ({ page }) => {
    await page.evaluate(() => {
      sessionStorage.setItem('vdc-entered', '1');
    });
    await page.reload();
    await expect(page).toHaveURL(/\/app$/);
  });

  test('/mcp shows MCP documentation page', async ({ page }) => {
    await page.goto('/mcp');
    await expect(page.locator('text=MCP Integration')).toBeVisible();
  });

  test('landing page MCP Docs link navigates to /mcp', async ({ page }) => {
    await page.reload();
    await page.click('a[href="/mcp"]');
    await expect(page).toHaveURL(/\/mcp$/);
    await expect(page.locator('text=MCP Integration')).toBeVisible();
  });

  test('logo dropdown Home navigates from /app to /', async ({ page }) => {
    await page.goto('/app');
    await page.waitForSelector('.react-flow');
    // Click the NavDropdown trigger button
    await page.click('button:has-text("VCompose")');
    // Click Home in the dropdown
    await page.click('button:has-text("Home")');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('text=Visual Docker Compose')).toBeVisible();
  });

  test('logo dropdown MCP Docs navigates from /app to /mcp', async ({ page }) => {
    await page.goto('/app');
    await page.waitForSelector('.react-flow');
    // Click the NavDropdown trigger button
    await page.click('button:has-text("VCompose")');
    // Click MCP Docs in the dropdown
    await page.click('button:has-text("MCP Docs")');
    await expect(page).toHaveURL(/\/mcp$/);
    await expect(page.locator('text=MCP Integration')).toBeVisible();
  });

  test('unknown route shows 404 page', async ({ page }) => {
    await page.goto('/some-nonexistent-page');
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    await expect(page.locator('text=doesn\'t exist')).toBeVisible();
  });

  test('404 page Open Builder link navigates to /app', async ({ page }) => {
    await page.goto('/nonexistent');
    await page.click('a:has-text("Open Builder")');
    await expect(page).toHaveURL(/\/app$/);
  });
});
