import { useState } from 'react';
import { useStore } from '../../store';
import { parseYaml } from '../../lib/yaml-parser';
import type { ParseResult } from '../../store/types';

interface ImportModalProps {
  onClose: () => void;
}

export function ImportModal({ onClose }: ImportModalProps) {
  const [yamlText, setYamlText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingResult, setPendingResult] = useState<ParseResult | null>(null);
  const importCompose = useStore((s) => s.importCompose);

  const handleImport = () => {
    const result = parseYaml(yamlText);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setPendingResult(result);
    setShowConfirm(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[600px] rounded-xl border border-subtle bg-surface p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Import docker-compose.yml</h2>

        <textarea
          value={yamlText}
          onChange={(e) => {
            setYamlText(e.target.value);
            setErrors([]);
            setShowConfirm(false);
          }}
          placeholder="Paste your docker-compose.yml here..."
          className="w-full rounded border border-subtle bg-elevated p-3 font-mono text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none"
          rows={16}
        />

        {errors.length > 0 && (
          <div className="mt-3 rounded-lg border border-[var(--error)]/30 bg-[var(--error)]/10 p-3 text-sm text-[var(--error)]">
            {errors.map((err, i) => (
              <div key={i}>{err}</div>
            ))}
          </div>
        )}

        {showConfirm && (
          <div className="mt-3 rounded-lg border border-accent/30 bg-accent/10 p-3">
            <p className="mb-2 text-sm text-accent">This will replace the current canvas. Continue?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded border border-subtle bg-elevated px-3 py-1.5 text-xs text-text-secondary transition-colors hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (pendingResult) importCompose(pendingResult);
                  onClose();
                }}
                className="rounded bg-accent px-3 py-1.5 text-xs text-base transition-colors hover:bg-accent-dim"
              >
                Confirm Import
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded border border-subtle bg-elevated px-4 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            data-testid="import-confirm-btn"
            disabled={!yamlText.trim()}
            className="rounded bg-accent px-4 py-2 text-sm text-base transition-colors hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-50"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
