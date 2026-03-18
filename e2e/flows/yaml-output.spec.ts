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

test('shows empty YAML with version and services when no nodes', async ({ page }) => {
  const yaml = page.locator('pre');
  await expect(yaml).toContainText('version: "3.8"');
  await expect(yaml).toContainText('services:');
});

test('shows warning badge when no services', async ({ page }) => {
  // ⚠ badge should be visible (no services warning)
  await expect(page.locator('[title="Warnings"]')).toBeVisible();
});

test('copy button copies YAML to clipboard', async ({ page, context }) => {
  // Grant clipboard permissions
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  await page.locator('button[title="Copy"]').click();

  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toContain('version');
});
