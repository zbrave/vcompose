import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
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
  return <LandingPage />;
}

function CanvasLayout() {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const setValidationIssues = useStore((s) => s.setValidationIssues);
  const navigate = useNavigate();

  const [activePanel, setActivePanel] = useState<string | null>('stacks');
  const [showImport, setShowImport] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

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
        <HeaderBar onSearchClick={() => setShowSearch(true)} />
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
          <YamlOutput />
        </div>
      </div>
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      <CommandSearch
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onImportClick={() => { setShowSearch(false); setShowImport(true); }}
        onToggleAI={() => { setShowSearch(false); setActivePanel('ai'); }}
        onNavigate={(path) => { setShowSearch(false); navigate(path); }}
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
