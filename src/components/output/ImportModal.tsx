import { useState } from 'react';
import { useStore } from '../../store';
import { parseYaml } from '../../lib/yaml-parser';

interface ImportModalProps {
  onClose: () => void;
}

export function ImportModal({ onClose }: ImportModalProps) {
  const [yamlText, setYamlText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const importCompose = useStore((s) => s.importCompose);

  const handleImport = () => {
    const result = parseYaml(yamlText);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    const confirmed = window.confirm('This will replace the current canvas. Continue?');
    if (!confirmed) return;

    importCompose(result);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[600px] rounded-lg bg-gray-800 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-200">Import docker-compose.yml</h2>

        <textarea
          value={yamlText}
          onChange={(e) => {
            setYamlText(e.target.value);
            setErrors([]);
          }}
          placeholder="Paste your docker-compose.yml here..."
          className="w-full rounded border border-gray-600 bg-gray-900 p-3 font-mono text-sm text-gray-300 placeholder-gray-600 focus:border-blue-500 focus:outline-none"
          rows={16}
        />

        {errors.length > 0 && (
          <div className="mt-3 rounded bg-red-900/50 p-3 text-sm text-red-300">
            {errors.map((err, i) => (
              <div key={i}>{err}</div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded bg-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            data-testid="import-confirm-btn"
            disabled={!yamlText.trim()}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
