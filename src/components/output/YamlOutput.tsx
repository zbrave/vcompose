import { useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Download, Share2, X } from 'lucide-react';
import { useStore } from '../../store';
import { buildYaml } from '../../lib/yaml-builder';
import { downloadYaml, copyYaml, shareOnTwitter } from '../../lib/yaml-download';
import { trackEvent, EVENTS } from '../../lib/analytics/events';

const customStyle: Record<string, React.CSSProperties> = {
  ...(atomDark as Record<string, React.CSSProperties>),
  'code[class*="language-"]': {
    ...((atomDark as Record<string, React.CSSProperties>)['code[class*="language-"]']),
    background: 'transparent',
    fontSize: '12px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  'pre[class*="language-"]': {
    ...((atomDark as Record<string, React.CSSProperties>)['pre[class*="language-"]']),
    background: 'transparent',
    margin: 0,
    padding: '8px 16px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
};

interface YamlOutputProps {
  onClose?: () => void;
}

export function YamlOutput({ onClose }: YamlOutputProps = {}) {
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

  return (
    <aside className="flex h-full w-full flex-col border-l border-subtle bg-surface md:w-[260px] md:h-auto">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="rounded p-0.5 text-text-muted hover:text-text-primary transition-colors"
              title="Close"
            >
              <X size={14} />
            </button>
          )}
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">YAML</h3>
          {hasErrors ? (
            <span className="text-xs text-[var(--error)]" title="Errors found">✗</span>
          ) : hasWarnings ? (
            <span className="text-xs text-accent" title="Warnings">⚠</span>
          ) : (
            <span className="text-xs text-[var(--success)]" title="Valid">✓</span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => {
              void copyYaml(yaml);
              trackEvent(EVENTS.YAML_COPIED, { serviceCount: nodes.length });
            }}
            className="rounded p-1 text-text-muted hover:text-accent transition-colors"
            title="Copy"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={() => {
              downloadYaml(yaml);
              trackEvent(EVENTS.YAML_DOWNLOADED, { serviceCount: nodes.length });
            }}
            className="rounded p-1 text-text-muted hover:text-accent transition-colors"
            title="Download"
          >
            <Download size={14} />
          </button>
          {nodes.length > 0 && (
            <button
              onClick={() => shareOnTwitter(nodes.length)}
              className="rounded p-1 text-text-muted hover:text-accent transition-colors"
              title="Share on X"
            >
              <Share2 size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <SyntaxHighlighter
          language="yaml"
          style={customStyle}
          wrapLongLines={true}
          customStyle={{ background: 'transparent', minHeight: '100%' }}
        >
          {yaml}
        </SyntaxHighlighter>
      </div>
    </aside>
  );
}
