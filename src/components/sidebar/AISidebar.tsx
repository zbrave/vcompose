import { useState, useCallback } from 'react';
import { useAIStore } from '../../store/ai-store';
import { useStore } from '../../store';
import { generateCompose, optimizeCompose } from '../../lib/ai/ai-provider';
import { parseYaml } from '../../lib/yaml-parser';
import { buildYaml } from '../../lib/yaml-builder';
import type { AIProviderKey } from '../../lib/ai/ai-types';
import { PROVIDER_MODELS } from '../../lib/ai/ai-types';
import { trackEvent, EVENTS } from '../../lib/analytics/events';

const PROVIDERS: { key: AIProviderKey; label: string }[] = [
  { key: 'openai', label: 'OpenAI' },
  { key: 'anthropic', label: 'Anthropic' },
  { key: 'gemini', label: 'Gemini' },
  { key: 'glm', label: 'GLM (z.ai)' },
];

const SKIP_GENERATE_CONFIRM_KEY = 'vdc-skip-generate-confirm';

export function AISidebar() {
  const { config, isLoading, error, setProvider, setApiKey, setModel, setBaseUrl, setLoading, setError } = useAIStore();
  const { nodes, edges, networks, namedVolumes, importCompose } = useStore();
  const [prompt, setPrompt] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [customModel, setCustomModel] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const canOptimize = nodes.length > 0;

  const doGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await generateCompose(prompt, config);

    if (result.success) {
      const parseResult = parseYaml(result.yaml);
      if (parseResult.success) {
        importCompose(parseResult);
      } else {
        setError('AI returned invalid YAML: ' + parseResult.errors[0]);
      }
    } else {
      setError(result.error ?? 'Unknown error');
    }

    setLoading(false);
    trackEvent(EVENTS.AI_GENERATE, { provider: config.provider, success: result.success });
  }, [prompt, config, setLoading, setError, importCompose]);

  async function handleGenerate() {
    if (!config.apiKey) {
      setError('Please enter an API key');
      return;
    }
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    // If canvas has services, confirm before replacing
    if (nodes.length > 0 && localStorage.getItem(SKIP_GENERATE_CONFIRM_KEY) !== 'true') {
      setShowConfirm(true);
      return;
    }

    await doGenerate();
  }

  async function handleOptimize() {
    if (!config.apiKey) {
      setError('Please enter an API key');
      return;
    }
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);

    const currentYaml = buildYaml({ nodes, edges, networks, namedVolumes });
    const result = await optimizeCompose(currentYaml, prompt, config);

    if (result.success) {
      const parseResult = parseYaml(result.yaml);
      if (parseResult.success) {
        importCompose(parseResult);
      } else {
        setError('AI returned invalid YAML: ' + parseResult.errors[0]);
      }
    } else {
      setError(result.error ?? 'Unknown error');
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-4 overflow-x-hidden overflow-y-auto">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
        AI Generation
      </h2>

      {/* Provider */}
      <div>
        <label className="mb-1 block text-xs text-text-secondary">Provider</label>
        <select
          value={config.provider}
          onChange={(e) => { setProvider(e.target.value as AIProviderKey); setCustomModel(false); }}
          className="w-full rounded border border-subtle bg-elevated px-2 py-1.5 text-sm text-text-primary"
          disabled={isLoading}
        >
          {PROVIDERS.map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* API Key */}
      <div>
        <label className="mb-1 block text-xs text-text-secondary">API Key</label>
        <div className="flex gap-1">
          <input
            type={showKey ? 'text' : 'password'}
            value={config.apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="min-w-0 flex-1 rounded border border-subtle bg-elevated px-2 py-1.5 text-sm text-text-primary placeholder-text-muted"
            disabled={isLoading}
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="shrink-0 rounded border border-subtle px-2 py-1.5 text-xs text-text-muted hover:text-text-primary"
            type="button"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {/* Model */}
      <div>
        <label className="mb-1 block text-xs text-text-secondary">Model</label>
        <select
          value={customModel ? '__custom__' : config.model}
          onChange={(e) => {
            if (e.target.value === '__custom__') {
              setCustomModel(true);
            } else {
              setCustomModel(false);
              setModel(e.target.value);
            }
          }}
          className="w-full rounded border border-subtle bg-elevated px-2 py-1.5 text-sm text-text-primary"
          disabled={isLoading}
        >
          {PROVIDER_MODELS[config.provider].map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
          <option value="__custom__">Custom...</option>
        </select>
        {customModel && (
          <input
            type="text"
            value={config.model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="model-id"
            className="mt-1 w-full rounded border border-subtle bg-elevated px-2 py-1.5 text-sm text-text-primary placeholder-text-muted"
            disabled={isLoading}
          />
        )}
      </div>

      {/* Base URL (only for custom model override) */}
      {customModel && (
        <div>
          <label className="mb-1 block text-xs text-text-secondary">Base URL</label>
          <input
            type="text"
            value={config.baseUrl ?? ''}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="Custom API base URL"
            className="w-full rounded border border-subtle bg-elevated px-2 py-1.5 text-sm text-text-primary placeholder-text-muted"
            disabled={isLoading}
          />
        </div>
      )}

      {/* Prompt */}
      <div>
        <label className="mb-1 block text-xs text-text-secondary">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your docker-compose setup..."
          rows={4}
          className="w-full resize-y rounded border border-subtle bg-elevated px-2 py-1.5 text-sm text-text-primary placeholder-text-muted"
          disabled={isLoading}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="flex-1 rounded bg-accent px-3 py-2 text-sm font-medium text-base transition-colors hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : canOptimize ? '✨ Generate New' : '✨ Generate'}
        </button>
        {canOptimize && (
        <button
          onClick={handleOptimize}
          disabled={isLoading}
          className="flex-1 rounded bg-elevated px-3 py-2 text-sm font-medium text-text-secondary border border-subtle transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Optimizing...' : '⚡ Optimize Current'}
        </button>
        )}
      </div>

      {/* Loading spinner */}
      {isLoading && (
        <div className="flex items-center justify-center py-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="ml-2 text-xs text-text-muted">AI is working...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded border border-[var(--error)]/30 bg-[var(--error)]/10 px-3 py-2 text-xs text-[var(--error)]">
          {error}
        </div>
      )}

      {/* Generate confirmation dialog */}
      {showConfirm && (
        <div className="rounded border border-accent/30 bg-accent/10 p-3">
          <p className="mb-3 text-xs text-accent">
            This will replace the current canvas with a new setup. Are you sure?
          </p>
          <label className="mb-3 flex items-center gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={dontAskAgain}
              onChange={(e) => setDontAskAgain(e.target.checked)}
              className="rounded border-subtle"
            />
            Don't ask again
          </label>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (dontAskAgain) {
                  localStorage.setItem(SKIP_GENERATE_CONFIRM_KEY, 'true');
                }
                setShowConfirm(false);
                await doGenerate();
              }}
              className="flex-1 rounded bg-accent px-2 py-1.5 text-xs font-medium text-base hover:bg-accent-dim"
            >
              Yes, replace
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 rounded border border-subtle px-2 py-1.5 text-xs text-text-muted hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
