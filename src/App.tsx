import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

const CanvasLayout = lazy(() => import('./components/CanvasLayout'));
const LandingPage = lazy(() =>
  import('./components/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const McpDocsPage = lazy(() =>
  import('./components/McpDocsPage').then((m) => ({ default: m.McpDocsPage }))
);
const NotFoundPage = lazy(() =>
  import('./components/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

function LoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-base">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-transparent"
        style={{ borderTopColor: 'var(--accent)' }}
      />
    </div>
  );
}

function LandingRedirect() {
  const location = useLocation();
  const forceLanding = (location.state as { showLanding?: boolean })?.showLanding;

  // If user intentionally navigated Home, skip all redirects
  if (!forceLanding) {
    const stored = localStorage.getItem('vdc-store');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.nodes?.length > 0) {
          return <Navigate to="/app" replace />;
        }
      } catch {
        // ignore
      }
    }
    if (sessionStorage.getItem('vdc-entered')) {
      return <Navigate to="/app" replace />;
    }
  }
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LandingPage />
    </Suspense>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingRedirect />} />
      <Route
        path="/app"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <CanvasLayout />
          </Suspense>
        }
      />
      <Route
        path="/mcp"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <McpDocsPage />
          </Suspense>
        }
      />
      <Route
        path="*"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <NotFoundPage />
          </Suspense>
        }
      />
    </Routes>
  );
}

export default App;
