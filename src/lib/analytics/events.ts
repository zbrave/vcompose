import posthog from 'posthog-js';
import { isAnalyticsEnabled } from './posthog';

export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  if (!isAnalyticsEnabled()) return;
  posthog.capture(event, properties);
}

export const EVENTS = {
  SERVICE_ADDED: 'service_added',
  STACK_ADDED: 'stack_added',
  EDGE_CREATED: 'edge_created',
  YAML_COPIED: 'yaml_copied',
  YAML_DOWNLOADED: 'yaml_downloaded',
  YAML_IMPORTED: 'yaml_imported',
  AI_GENERATE: 'ai_generate',
  COMMAND_PALETTE_USED: 'command_palette_used',
  ERROR_OCCURRED: 'error_occurred',
} as const;
