import { useMemo, useState } from 'react';
import { useStore } from '../../store';
import { buildYaml } from '../../lib/yaml-builder';
import { ImportModal } from './ImportModal';

export function YamlOutput() {
  const [showImport, setShowImport] = useState(false);
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const networks = useStore((s) => s.networks);
  const namedVolumes = useStore((s) => s.namedVolumes);
  const validationIssues = useStore((s) => s.validationIssues);

  const yaml = useMemo(
    () => buildYaml({ nodes, edges, networks, namedVolumes }),
    [nodes, edges, networks, namedVolumes],
  );

  const hasErrors = validationIssues.some((i) => i.severity === 'error');
  const hasWarnings = validationIssues.some((i) => i.severity === 'warning');
  const badge = hasErrors ? '❌' : hasWarnings ? '⚠️' : '✅';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(yaml);
  };

  const download = () => {
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'docker-compose.yml';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col border-t border-gray-700">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">YAML</h3>
          <span title={hasErrors ? 'Errors found' : hasWarnings ? 'Warnings' : 'Valid'}>
            {badge}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={copyToClipboard}
            className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600 transition-colors"
          >
            Copy
          </button>
          <button
            onClick={download}
            className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600 transition-colors"
          >
            Download
          </button>
          <button
            onClick={() => setShowImport(true)}
            data-testid="import-btn"
            className="rounded bg-blue-700 px-2 py-1 text-xs text-white hover:bg-blue-600 transition-colors"
          >
            Import
          </button>
        </div>
      </div>
      <pre className="flex-1 overflow-auto bg-gray-950 px-4 py-2 font-mono text-xs text-green-400">
        {yaml}
      </pre>
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
}
