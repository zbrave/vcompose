import { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileInput, Trash2, Download, Bot, Home, BookOpen } from 'lucide-react';
import { SERVICE_REGISTRY } from '../data/service-registry';
import { STACK_CATALOG } from '../data/stack-catalog';
import { useStore } from '../store';
import { downloadYaml } from '../lib/yaml-download';
import { buildYaml } from '../lib/yaml-builder';

interface CommandSearchProps {
  open: boolean;
  onClose: () => void;
  onImportClick: () => void;
  onToggleAI: () => void;
  onNavigate: (path: string) => void;
}

export function CommandSearch({ open, onClose, onImportClick, onToggleAI, onNavigate }: CommandSearchProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Reset confirm state when dialog closes
  useEffect(() => {
    if (!open) {
      setShowClearConfirm(false);
    }
  }, [open]);

  const getCenter = () => ({
    x: window.innerWidth / 2 - 80,
    y: window.innerHeight / 2 - 40,
  });

  const handleServiceSelect = (key: string) => {
    useStore.getState().addServiceFromRegistry(key, getCenter());
    onClose();
  };

  const handleStackSelect = (key: string) => {
    useStore.getState().addStack(key, getCenter());
    onClose();
  };

  const handleImport = () => {
    onClose();
    onImportClick();
  };

  const handleClearRequest = () => {
    setShowClearConfirm(true);
  };

  const handleClearConfirm = () => {
    useStore.setState({
      nodes: [],
      edges: [],
      networks: [],
      namedVolumes: [],
      selectedNodeId: null,
    });
    onClose();
  };

  const handleExport = () => {
    downloadYaml(buildYaml(useStore.getState()));
    onClose();
  };

  const handleToggleAI = () => {
    onClose();
    onToggleAI();
  };

  const handleGoHome = () => {
    sessionStorage.removeItem('vdc-entered');
    onNavigate('/');
  };

  const handleGoMcpDocs = () => {
    onNavigate('/mcp');
  };

  const limitedServices = SERVICE_REGISTRY.slice(0, 20);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-[101] flex items-start justify-center pointer-events-none"
          >
            <div
              className="mt-[20vh] mx-auto w-full max-w-lg rounded-xl border border-subtle shadow-2xl pointer-events-auto overflow-hidden"
              style={{
                backgroundColor: 'rgba(38, 34, 32, 0.95)',
                backdropFilter: 'blur(20px)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {showClearConfirm ? (
                /* Clear Confirmation */
                <div className="p-6">
                  <p className="mb-4 text-sm text-text-primary font-medium">Clear all services?</p>
                  <p className="mb-6 text-xs text-text-muted">
                    This will remove all services, edges, networks, and volumes from the canvas.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="rounded-md border border-subtle bg-elevated px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleClearConfirm}
                      className="rounded-md bg-[var(--error)] px-3 py-1.5 text-xs text-white hover:opacity-90 transition-opacity"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              ) : (
                <Command
                  className="flex flex-col"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      onClose();
                    }
                  }}
                >
                  {/* Search input */}
                  <div className="flex items-center gap-2 border-b border-subtle px-4 py-3">
                    <Search size={15} className="text-text-muted flex-shrink-0" />
                    <Command.Input
                      placeholder="Search services, stacks, actions..."
                      className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                      autoFocus
                    />
                  </div>

                  {/* Results */}
                  <Command.List className="max-h-80 overflow-y-auto p-2">
                    <Command.Empty className="px-4 py-8 text-center text-sm text-text-muted">
                      No results found
                    </Command.Empty>

                    {/* Actions Group */}
                    <Command.Group
                      heading="Actions"
                      className="[&>[cmdk-group-heading]]:px-2 [&>[cmdk-group-heading]]:py-1 [&>[cmdk-group-heading]]:text-xs [&>[cmdk-group-heading]]:text-text-muted [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-wider"
                    >
                      <Command.Item
                        value="import yaml"
                        onSelect={handleImport}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-text-primary data-[selected=true]:bg-[var(--accent)]/10 data-[selected=true]:text-accent outline-none"
                      >
                        <FileInput size={15} className="text-text-muted flex-shrink-0" />
                        <div className="flex flex-col">
                          <span>Import YAML</span>
                          <span className="text-xs text-text-muted">Load a docker-compose.yml file</span>
                        </div>
                      </Command.Item>

                      <Command.Item
                        value="export yaml download"
                        onSelect={handleExport}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-text-primary data-[selected=true]:bg-[var(--accent)]/10 data-[selected=true]:text-accent outline-none"
                      >
                        <Download size={15} className="text-text-muted flex-shrink-0" />
                        <div className="flex flex-col">
                          <span>Export YAML</span>
                          <span className="text-xs text-text-muted">Download docker-compose.yml</span>
                        </div>
                      </Command.Item>

                      <Command.Item
                        value="clear canvas remove all"
                        onSelect={handleClearRequest}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-text-primary data-[selected=true]:bg-[var(--accent)]/10 data-[selected=true]:text-accent outline-none"
                      >
                        <Trash2 size={15} className="text-text-muted flex-shrink-0" />
                        <div className="flex flex-col">
                          <span>Clear Canvas</span>
                          <span className="text-xs text-text-muted">Remove all services and connections</span>
                        </div>
                      </Command.Item>

                      <Command.Item
                        value="toggle ai assistant"
                        onSelect={handleToggleAI}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-text-primary data-[selected=true]:bg-[var(--accent)]/10 data-[selected=true]:text-accent outline-none"
                      >
                        <Bot size={15} className="text-text-muted flex-shrink-0" />
                        <div className="flex flex-col">
                          <span>Toggle AI</span>
                          <span className="text-xs text-text-muted">Open AI generation panel</span>
                        </div>
                      </Command.Item>

                      <Command.Item
                        value="go home landing page"
                        onSelect={handleGoHome}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-text-primary data-[selected=true]:bg-[var(--accent)]/10 data-[selected=true]:text-accent outline-none"
                      >
                        <Home size={15} className="text-text-muted flex-shrink-0" />
                        <div className="flex flex-col">
                          <span>Go to Home</span>
                          <span className="text-xs text-text-muted">Return to landing page</span>
                        </div>
                      </Command.Item>

                      <Command.Item
                        value="go mcp docs documentation"
                        onSelect={handleGoMcpDocs}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-text-primary data-[selected=true]:bg-[var(--accent)]/10 data-[selected=true]:text-accent outline-none"
                      >
                        <BookOpen size={15} className="text-text-muted flex-shrink-0" />
                        <div className="flex flex-col">
                          <span>MCP Docs</span>
                          <span className="text-xs text-text-muted">View MCP integration guide</span>
                        </div>
                      </Command.Item>
                    </Command.Group>

                    {/* Stacks Group */}
                    <Command.Group
                      heading="Stacks"
                      className="mt-1 [&>[cmdk-group-heading]]:px-2 [&>[cmdk-group-heading]]:py-1 [&>[cmdk-group-heading]]:text-xs [&>[cmdk-group-heading]]:text-text-muted [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-wider"
                    >
                      {STACK_CATALOG.map((stack) => (
                        <Command.Item
                          key={stack.key}
                          value={`stack ${stack.name} ${stack.tags.join(' ')}`}
                          onSelect={() => handleStackSelect(stack.key)}
                          className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-text-primary data-[selected=true]:bg-[var(--accent)]/10 data-[selected=true]:text-accent outline-none"
                        >
                          <span className="text-base flex-shrink-0">{stack.icon}</span>
                          <div className="flex flex-col min-w-0">
                            <span>{stack.name}</span>
                            <span className="text-xs text-text-muted truncate">{stack.description}</span>
                          </div>
                        </Command.Item>
                      ))}
                    </Command.Group>

                    {/* Services Group */}
                    <Command.Group
                      heading="Services"
                      className="mt-1 [&>[cmdk-group-heading]]:px-2 [&>[cmdk-group-heading]]:py-1 [&>[cmdk-group-heading]]:text-xs [&>[cmdk-group-heading]]:text-text-muted [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-wider"
                    >
                      {limitedServices.map((service) => (
                        <Command.Item
                          key={service.key}
                          value={`service ${service.name} ${service.description} ${service.category}`}
                          onSelect={() => handleServiceSelect(service.key)}
                          className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-text-primary data-[selected=true]:bg-[var(--accent)]/10 data-[selected=true]:text-accent outline-none"
                        >
                          <span className="w-7 h-7 flex-shrink-0 rounded flex items-center justify-center bg-elevated text-xs font-bold text-accent">
                            {service.name.slice(0, 2).toUpperCase()}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span>{service.name}</span>
                            <span className="text-xs text-text-muted truncate">{service.description}</span>
                          </div>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </Command.List>
                </Command>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
