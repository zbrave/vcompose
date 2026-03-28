import { useState } from 'react';
import { Undo2, Redo2, Trash2, Settings } from 'lucide-react';
import { NavDropdown } from './NavDropdown';
import { useStore } from '../store';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import type { TemporalState } from 'zundo';
import type { AppStore } from '../store/types';

type TemporalAppStore = Pick<AppStore, 'nodes' | 'edges' | 'networks' | 'namedVolumes'>;

function useTemporalStore<T>(selector: (state: TemporalState<TemporalAppStore>) => T): T {
  return useStoreWithEqualityFn(useStore.temporal, selector);
}

interface HeaderBarProps {
  onSearchClick?: () => void;
}

const iconBtnCls =
  'rounded-md p-1.5 text-text-muted hover:text-text-primary hover:bg-elevated transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-muted';

export function HeaderBar({ onSearchClick }: HeaderBarProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const { undo, redo } = useStore.temporal.getState();
  const canUndo = useTemporalStore((s) => s.pastStates.length > 0);
  const canRedo = useTemporalStore((s) => s.futureStates.length > 0);
  const hasContent = useStore((s) => s.nodes.length > 0 || s.edges.length > 0);

  const handleClearAll = () => {
    useStore.setState({
      nodes: [],
      edges: [],
      networks: [],
      namedVolumes: [],
      selectedNodeId: null,
      validationIssues: [],
    });
    setShowClearConfirm(false);
  };

  return (
    <header className="flex h-10 items-center border-b border-subtle bg-surface px-4">
      {/* Left: Logo + Nav Dropdown */}
      <NavDropdown />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Center: Search trigger */}
      <button
        onClick={onSearchClick}
        className="rounded-md border border-subtle bg-elevated px-3 py-1 text-sm text-text-muted hover:text-text-secondary transition-colors"
      >
        Search... ⌘K
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: Undo / Redo / Clear / Settings */}
      <div className="flex items-center gap-1">
        <button
          onClick={(_e) => { undo(); }}
          disabled={!canUndo}
          className={iconBtnCls}
          title="Undo"
        >
          <Undo2 size={15} />
        </button>

        <button
          onClick={(_e) => { redo(); }}
          disabled={!canRedo}
          className={iconBtnCls}
          title="Redo"
        >
          <Redo2 size={15} />
        </button>

        {/* Clear All with confirmation popover */}
        <div className="relative">
          <button
            onClick={() => setShowClearConfirm((v) => !v)}
            disabled={!hasContent}
            className={iconBtnCls}
            title="Clear All"
          >
            <Trash2 size={15} />
          </button>

          {showClearConfirm && (
            <div className="absolute right-0 top-full z-50 mt-1 rounded-lg border border-subtle bg-elevated p-3 shadow-xl">
              <p className="mb-2 text-xs text-text-secondary">Clear all services?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="rounded border border-subtle bg-elevated px-2 py-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="rounded bg-[var(--error)] px-2 py-1 text-xs text-white hover:opacity-90 transition-opacity"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          disabled
          className={iconBtnCls}
          title="Settings (coming soon)"
        >
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
}
