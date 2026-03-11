import { useStore } from '../../store';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import type { TemporalState } from 'zundo';
import type { AppStore } from '../../store/types';

type TemporalAppStore = Pick<AppStore, 'nodes' | 'edges' | 'networks' | 'namedVolumes'>;

function useTemporalStore<T>(
  selector: (state: TemporalState<TemporalAppStore>) => T,
): T {
  return useStoreWithEqualityFn(useStore.temporal, selector);
}

export function UndoRedoToolbar() {
  const { undo, redo } = useStore.temporal.getState();
  const canUndo = useTemporalStore((s) => s.pastStates.length > 0);
  const canRedo = useTemporalStore((s) => s.futureStates.length > 0);

  const btnCls =
    'rounded bg-gray-800 p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-800 disabled:hover:text-gray-400';

  return (
    <div className="absolute left-2 top-2 z-10 flex gap-1 rounded-lg border border-gray-700 bg-gray-900/90 p-1 backdrop-blur-sm">
      <button
        onClick={() => undo()}
        disabled={!canUndo}
        className={btnCls}
        title="Undo (Ctrl+Z)"
        data-testid="undo-btn"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.69 3L3 13" />
        </svg>
      </button>
      <button
        onClick={() => redo()}
        disabled={!canRedo}
        className={btnCls}
        title="Redo (Ctrl+Y)"
        data-testid="redo-btn"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 7v6h-6" />
          <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.69 3L21 13" />
        </svg>
      </button>
    </div>
  );
}
