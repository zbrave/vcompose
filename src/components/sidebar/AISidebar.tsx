import { useState, useCallback } from 'react';
import { useAIStore } from '../../store/ai-store';
import { useStore } from '../../store';
import { generateCompose, optimizeCompose } from '../../lib/ai/ai-provider';
import { parseYaml } from '../../lib/yaml-parser';
import { buildYaml } from '../../lib/yaml-builder';
import type { AIProviderKey } from '../../lib/ai/ai-types';
import { DEFAULT_MODELS } from '../../lib/ai/ai-types';

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
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
        AI Generation
      </h2>

      {/* Provider */}
      <div>
        <label className="mb-1 block text-xs text-gray-400">Provider</label>
        <select
          value={config.provider}
          onChange={(e) => setProvider(e.target.value as AIProviderKey)}
          className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
          disabled={isLoading}
        >
          {PROVIDERS.map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* API Key */}
      <div>
        <label className="mb-1 block text-xs text-gray-400">API Key</label>
        <div className="flex gap-1">
          <input
            type={showKey ? 'text' : 'password'}
            value={config.apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="min-w-0 flex-1 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white placeholder-gray-500"
            disabled={isLoading}
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="shrink-0 rounded border border-gray-700 px-2 py-1.5 text-xs text-gray-400 hover:text-white"
            type="button"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {/* Model */}
      <div>
        <label className="mb-1 block text-xs text-gray-400">Model</label>
        {customModel ? (
          <div className="flex gap-1">
            <input
              type="text"
              value={config.model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="model-name"
              className="min-w-0 flex-1 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white placeholder-gray-500"
              disabled={isLoading}
            />
            <button
              onClick={() => { setCustomModel(false); setModel(DEFAULT_MODELS[config.provider]); }}
              className="shrink-0 rounded border border-gray-700 px-2 py-1.5 text-xs text-gray-400 hover:text-white"
              type="button"
            >
              Default
            </button>
          </div>
        ) : (
          <div className="flex gap-1">
            <span className="flex-1 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white">
              {DEFAULT_MODELS[config.provider]}
            </span>
            <button
              onClick={() => setCustomModel(true)}
              className="shrink-0 rounded border border-gray-700 px-2 py-1.5 text-xs text-gray-400 hover:text-white"
              type="button"
            >
              Custom
            </button>
          </div>
        )}
      </div>

      {/* Base URL (only for custom model override) */}
      {customModel && (
        <div>
          <label className="mb-1 block text-xs text-gray-400">Base URL</label>
          <input
            type="text"
            value={config.baseUrl ?? ''}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="Custom API base URL"
            className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white placeholder-gray-500"
            disabled={isLoading}
          />
        </div>
      )}

      {/* Prompt */}
      <div>
        <label className="mb-1 block text-xs text-gray-400">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your docker-compose setup..."
          rows={4}
          className="w-full resize-y rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white placeholder-gray-500"
          disabled={isLoading}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="flex-1 rounded bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : 'Generate'}
        </button>
        <button
          onClick={handleOptimize}
          disabled={isLoading || !canOptimize}
          className="flex-1 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          title={!canOptimize ? 'Add services to canvas first' : ''}
        >
          {isLoading ? 'Optimizing...' : 'Optimize'}
        </button>
      </div>

      {/* Loading spinner */}
      {isLoading && (
        <div className="flex items-center justify-center py-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          <span className="ml-2 text-xs text-gray-400">AI is working...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded border border-red-800 bg-red-900/30 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Generate confirmation dialog */}
      {showConfirm && (
        <div className="rounded border border-yellow-700 bg-yellow-900/30 p-3">
          <p className="mb-3 text-xs text-yellow-300">
            This will replace the current canvas with a new setup. Are you sure?
          </p>
          <label className="mb-3 flex items-center gap-2 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={dontAskAgain}
              onChange={(e) => setDontAskAgain(e.target.checked)}
              className="rounded border-gray-600"
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
              className="flex-1 rounded bg-purple-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
            >
              Yes, replace
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 rounded border border-gray-700 px-2 py-1.5 text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
