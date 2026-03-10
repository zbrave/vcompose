import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useStore } from './store';
import { validate } from './lib/validator';
import { NodePalette } from './components/sidebar/NodePalette';
import { NetworkPanel } from './components/sidebar/NetworkPanel';
import { FlowCanvas } from './components/canvas/FlowCanvas';
import { ConfigPanel } from './components/panel/ConfigPanel';
import { YamlOutput } from './components/output/YamlOutput';

function App() {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const setValidationIssues = useStore((s) => s.setValidationIssues);

  // Validation as derived state
  useEffect(() => {
    const issues = validate({ nodes, edges });
    setValidationIssues(issues);
  }, [nodes, edges, setValidationIssues]);

  return (
    <ReactFlowProvider>
      <div className="flex h-screen w-screen">
        {/* Sidebar - Node Palette */}
        <aside className="w-60 border-r border-gray-800 bg-gray-900 p-4">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Services
          </h2>
          <NodePalette />
          <div className="mt-6 border-t border-gray-800 pt-4">
            <NetworkPanel />
          </div>
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
    </ReactFlowProvider>
  );
}

export default App;
