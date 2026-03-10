import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/flows',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
  },
});
