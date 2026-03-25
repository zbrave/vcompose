import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store';
import { validate } from '../lib/validator';
import { HeaderBar } from './HeaderBar';
import { IconRail } from './sidebar/IconRail';
import { SidePanel } from './sidebar/SidePanel';
import { StacksPanel } from './sidebar/StacksPanel';
import { MarketplacePanel } from './sidebar/MarketplacePanel';
import { AISidebar } from './sidebar/AISidebar';
import { NetworkPanel } from './sidebar/NetworkPanel';
import { FlowCanvas } from './canvas/FlowCanvas';
import { FloatingConfigPanel } from './panel/FloatingConfigPanel';
import { YamlOutput } from './output/YamlOutput';
import { ImportModal } from './output/ImportModal';
import { CommandSearch } from './CommandSearch';
import ToastContainer from './ToastContainer';

export default function CanvasLayout() {
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
      <ToastContainer />
    </ReactFlowProvider>
  );
}
