import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import posthog from 'posthog-js';
import { initPostHog, isAnalyticsEnabled } from '../lib/analytics/posthog';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (!isAnalyticsEnabled()) return;
    posthog.capture('$pageview', {
      $current_url: window.location.href,
    });
  }, [location.pathname]);

  return <>{children}</>;
}
