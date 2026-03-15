import { useEffect, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useStore } from './store';
import { validate } from './lib/validator';
import { LandingPage } from './components/LandingPage';
import { HeaderBar } from './components/HeaderBar';
import { SidebarTabs } from './components/sidebar/SidebarTabs';
import { FlowCanvas } from './components/canvas/FlowCanvas';
import { ConfigPanel } from './components/panel/ConfigPanel';
import { YamlOutput } from './components/output/YamlOutput';

function App() {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const setValidationIssues = useStore((s) => s.setValidationIssues);

  // Show landing page unless user has clicked "Start Building" or has existing work
  const [showLanding, setShowLanding] = useState(() => {
    // If user has nodes from a previous session, skip landing
    const stored = localStorage.getItem('vdc-store');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.nodes?.length > 0) return false;
      } catch {
        // ignore
      }
    }
    return !sessionStorage.getItem('vdc-entered');
  });

  const handleEnter = () => {
    sessionStorage.setItem('vdc-entered', '1');
    setShowLanding(false);
  };

  // Validation as derived state
  useEffect(() => {
    const issues = validate({ nodes, edges });
    setValidationIssues(issues);
  }, [nodes, edges, setValidationIssues]);

  if (showLanding) {
    return <LandingPage onEnter={handleEnter} />;
  }

  return (
    <ReactFlowProvider>
      <div className="flex h-screen w-screen flex-col">
        <HeaderBar />
        <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Node Palette + AI */}
        <aside className="w-72 border-r border-gray-800 bg-gray-900 p-4">
          <SidebarTabs />
        </aside>

        {/* Canvas */}
        <main className="flex-1">
          <FlowCanvas />
        </main>

        {/* Right Panel - Config + YAML Output */}
        <aside className="flex w-80 flex-col border-l border-gray-800 bg-gray-900">
          {selectedNodeId ? (
            <ConfigPanel />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-600">
              Select a service to configure
            </div>
          )}
          <YamlOutput />
        </aside>
        </div>
      </div>
    </ReactFlowProvider>
  );
}

export default App;
