import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string) || 'https://us.i.posthog.com';

export function initPostHog(): void {
  if (!POSTHOG_KEY) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    autocapture: true,
    capture_exceptions: true,
    session_recording: {
      maskAllInputs: true,
    },
  });

  if (import.meta.env.DEV) {
    posthog.debug();
  }
}

export function isAnalyticsEnabled(): boolean {
  return Boolean(POSTHOG_KEY);
}
