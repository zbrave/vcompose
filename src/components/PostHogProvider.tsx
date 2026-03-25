import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import posthog from 'posthog-js';
import { initPostHog, isAnalyticsEnabled } from '../lib/analytics/posthog';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    const cb = () => initPostHog();
    'requestIdleCallback' in window
      ? requestIdleCallback(cb)
      : setTimeout(cb, 1);
  }, []);

  useEffect(() => {
    if (!isAnalyticsEnabled()) return;
    posthog.capture('$pageview', {
      $current_url: window.location.href,
    });
  }, [location.pathname]);

  return <>{children}</>;
}
