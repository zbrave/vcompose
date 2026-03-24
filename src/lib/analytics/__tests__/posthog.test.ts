import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('isAnalyticsEnabled', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns false when VITE_POSTHOG_KEY is not set', async () => {
    vi.stubEnv('VITE_POSTHOG_KEY', '');
    const { isAnalyticsEnabled } = await import('../posthog');
    expect(isAnalyticsEnabled()).toBe(false);
  });

  it('returns true when VITE_POSTHOG_KEY is set', async () => {
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test123');
    const { isAnalyticsEnabled } = await import('../posthog');
    expect(isAnalyticsEnabled()).toBe(true);
  });
});
