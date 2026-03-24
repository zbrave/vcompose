# PostHog Analytics Integration — Design Spec

> **Phase 12:** Product analytics + error tracking via PostHog Cloud.

---

## 1. Overview

Visual Docker Compose Builder'a PostHog Cloud entegrasyonu eklenir. Tek araçla kullanıcı davranışı analytics'i, session replay, heatmap ve error tracking sağlanır. Self-hosted PostHog sunucu kaynaklarına sığmadığı için (CAX11 4GB RAM) Cloud free tier (1M event/ay) kullanılır.

---

## 2. Dependencies

| Paket | Versiyon | Amaç |
|---|---|---|
| `posthog-js` | latest | PostHog JavaScript SDK |

> Not: `@posthog/react` paketi PostHog docs'ta önerilir, Context Provider pattern kullanır. Ancak `posthog-js` global singleton olarak daha hafif ve Vite SPA için yeterlidir.

---

## 3. Environment Variables

```env
VITE_POSTHOG_KEY=phc_xxxxxxxxxxxxx
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

- `.env.example`'a eklenir (değer boş).
- Key yoksa analytics tamamen devre dışı kalır (no-op).

---

## 4. File Structure

```
src/
  lib/
    analytics/
      posthog.ts        # init, isEnabled check
      events.ts         # trackEvent() + typed event constants
  components/
    PostHogProvider.tsx  # Root wrapper, SPA pageview tracking
    ErrorBoundary.tsx    # React error boundary + PostHog exception capture
```

---

## 5. Initialization — `src/lib/analytics/posthog.ts`

```typescript
import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

export function initPostHog(): void {
  if (!POSTHOG_KEY) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,          // SPA — manuel yönetilir
    autocapture: true,                // click, input otomatik
    capture_exceptions: true,         // unhandled error + rejection otomatik yakalanır
    session_recording: {
      maskAllInputs: true,            // API key gibi hassas input'lar maskelenir
    },
  });

  if (import.meta.env.DEV) {
    posthog.debug();
  }
}

export function isAnalyticsEnabled(): boolean {
  return Boolean(POSTHOG_KEY);
}
```

---

## 6. PostHogProvider — `src/components/PostHogProvider.tsx`

```typescript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import posthog from 'posthog-js';
import { initPostHog, isAnalyticsEnabled } from '../lib/analytics/posthog';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  // Init on mount
  useEffect(() => {
    initPostHog();
  }, []);

  // SPA pageview tracking
  useEffect(() => {
    if (!isAnalyticsEnabled()) return;
    posthog.capture('$pageview', {
      $current_url: window.location.href,
    });
  }, [location.pathname]);

  return <>{children}</>;
}
```

> `PostHogProvider` sadece bir wrapper, children'ı olduğu gibi render eder. Context API kullanmaz — `posthog` global singleton'dır.

---

## 7. Error Boundary — `src/components/ErrorBoundary.tsx`

```typescript
import { Component, type ReactNode } from 'react';
import posthog from 'posthog-js';
import { isAnalyticsEnabled } from '../lib/analytics/posthog';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (isAnalyticsEnabled()) {
      posthog.captureException(error, {
        type: 'react_error_boundary',
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)] text-[var(--text-secondary)]">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Bir hata oluştu</h2>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded bg-[var(--accent-primary)] text-[var(--bg-primary)]"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

## 8. Custom Events — `src/lib/analytics/events.ts`

```typescript
import posthog from 'posthog-js';
import { isAnalyticsEnabled } from './posthog';

export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  if (!isAnalyticsEnabled()) return;
  posthog.capture(event, properties);
}

// Event name constants
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
```

---

## 9. Entegrasyon Noktaları

| Dosya | Değişiklik |
|---|---|
| `.env.example` | `VITE_POSTHOG_KEY=` ve `VITE_POSTHOG_HOST=` eklenir |
| `src/main.tsx` | `<ErrorBoundary>` > `<BrowserRouter>` > `<PostHogProvider>` > `<App />` sırasıyla sarar |
| `src/store/index.ts` | `addNode`, `addStack`, `addEdge`, `importCompose`, `addServiceFromRegistry`, `addServiceFromHub`, `addRecommendedNode` action'larının sonunda `trackEvent()` |
| `src/components/output/YamlOutput.tsx` | Copy ve download butonlarında `trackEvent()` |
| `src/components/sidebar/AISidebar.tsx` | Generate butonunda `trackEvent()` |
| `src/components/CommandSearch.tsx` | Action seçiminde `trackEvent()` |
| `PROJECT_SPEC.md` | Section 2 Technology Stack tablosuna `posthog-js` eklenir |
| `Dockerfile` | `ARG VITE_POSTHOG_KEY` ve `ARG VITE_POSTHOG_HOST` build args eklenir |

---

## 10. Privacy & Güvenlik

- **`maskAllInputs: true`**: Session replay'de tüm input değerleri maskelenir (API key, password vs.)
- **No PII**: `identify()` çağrılmaz — tüm kullanıcılar anonim
- **No-op guard**: `VITE_POSTHOG_KEY` yoksa hiçbir PostHog kodu çalışmaz
- **Environment variable'lar error payload'a dahil edilmez**
- **Persistence**: PostHog default persistence (`localStorage+cookie`) anonim session tracking için kullanılır. Kullanıcı tanımlayıcı veri saklanmaz.

---

## 11. PostHog Cloud Kurulumu (Manuel)

1. https://posthog.com adresinden ücretsiz hesap oluştur
2. Proje oluştur, Project API Key ve Host bilgisini al
3. `.env` dosyasına `VITE_POSTHOG_KEY` ve `VITE_POSTHOG_HOST` yaz
4. Coolify'da **build argument** olarak ekle (Vite, `VITE_*` değişkenlerini build-time'da inline eder — runtime env yetmez)
5. Deploy et — event'ler PostHog dashboard'da görünecek

---

## 12. Test Stratejisi

- **Unit test yok** — `posthog-js` SDK'sını mock'lamak değer katmaz
- **E2E test yok** — analytics network call'ları E2E test'lerde engellenir
- **Manuel doğrulama**: Dev'de PostHog debug mode açılır, console'da event'ler görülür
- **Guard test**: `src/lib/analytics/__tests__/posthog.test.ts` — `isAnalyticsEnabled()` key yokken `false` döndüğünü doğrulayan test (`vi.stubEnv()` ile)

---

## 13. Scope Dışı

- User identification / login (uygulama login gerektirmiyor)
- Feature flags (şu an ihtiyaç yok)
- A/B testing
- Surveys
- PostHog self-hosted kurulumu
