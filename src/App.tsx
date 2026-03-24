import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from './store';
import { validate } from './lib/validator';
import { HeaderBar } from './components/HeaderBar';
import { IconRail } from './components/sidebar/IconRail';
import { SidePanel } from './components/sidebar/SidePanel';
import { StacksPanel } from './components/sidebar/StacksPanel';
import { MarketplacePanel } from './components/sidebar/MarketplacePanel';
import { AISidebar } from './components/sidebar/AISidebar';
import { NetworkPanel } from './components/sidebar/NetworkPanel';
import { FlowCanvas } from './components/canvas/FlowCanvas';
import { FloatingConfigPanel } from './components/panel/FloatingConfigPanel';
import { YamlOutput } from './components/output/YamlOutput';
import { ImportModal } from './components/output/ImportModal';
import { CommandSearch } from './components/CommandSearch';
import { LandingPage } from './components/LandingPage';
import { McpDocsPage } from './components/McpDocsPage';

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
  return <LandingPage />;
}

function CanvasLayout() {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const setValidationIssues = useStore((s) => s.setValidationIssues);
  const navigate = useNavigate();

  const [activePanel, setActivePanel] = useState<string | null>(
    window.innerWidth >= 768 ? 'stacks' : null,
  );
  const [showImport, setShowImport] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showYaml, setShowYaml] = useState(false);

  useEffect(() => {
    const issues = validate({ nodes, edges });
    setValidationIssues(issues);
  }, [nodes, edges, setValidationIssues]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <ReactFlowProvider>
      <div className="flex h-screen flex-col bg-base text-text-primary">
        <HeaderBar
          onSearchClick={() => setShowSearch(true)}
          onYamlToggle={() => setShowYaml((v) => !v)}
          showYaml={showYaml}
        />
        <div className="flex flex-1 overflow-hidden">
          <IconRail
            activePanel={activePanel}
            onPanelChange={setActivePanel}
            onImportClick={() => setShowImport(true)}
          />
          <SidePanel
            isOpen={activePanel !== null}
            onClose={() => setActivePanel(null)}
          >
            {activePanel === 'stacks' && <StacksPanel />}
            {activePanel === 'marketplace' && <MarketplacePanel />}
            {activePanel === 'ai' && <AISidebar />}
            {activePanel === 'networks' && <NetworkPanel />}
          </SidePanel>
          <div className="relative flex-1">
            <FlowCanvas />
            <FloatingConfigPanel />
          </div>
          {/* Desktop YAML sidebar */}
          <div className="hidden md:flex">
            <YamlOutput />
          </div>

          {/* Mobile YAML overlay */}
          <AnimatePresence>
            {showYaml && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex justify-end md:hidden"
              >
                <div className="absolute inset-0 bg-black/50" onClick={() => setShowYaml(false)} />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="relative h-full w-[280px]"
                >
                  <YamlOutput onClose={() => setShowYaml(false)} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      <CommandSearch
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onImportClick={() => { setShowSearch(false); setShowImport(true); }}
        onToggleAI={() => { setShowSearch(false); setActivePanel('ai'); }}
        onNavigate={(path) => { setShowSearch(false); navigate(path, path === '/' ? { state: { showLanding: true } } : undefined); }}
      />
    </ReactFlowProvider>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingRedirect />} />
      <Route path="/app" element={<CanvasLayout />} />
      <Route path="/mcp" element={<McpDocsPage />} />
    </Routes>
  );
}

export default App;
