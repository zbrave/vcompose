import { generateCompose, optimizeCompose } from '@vdc/lib/ai/ai-provider';
import { validate } from '@vdc/lib/validator';
import { parseYaml } from '@vdc/lib/yaml-parser';
import type { AIConfig, AIProviderKey } from '@vdc/lib/ai/ai-types';
import { DEFAULT_MODELS } from '@vdc/lib/ai/ai-types';

export interface AIGenerateComposeInput {
  prompt: string;
  provider: AIProviderKey;
  apiKey: string;
  model?: string;
  baseUrl?: string;
  mode?: 'generate' | 'optimize';
  yaml?: string;
}

export interface AIGenerateComposeOutput {
  yaml: string;
  validation: Array<{ severity: string; message: string; field?: string }>;
  error?: string;
}

export async function handleAIGenerateCompose(
  input: AIGenerateComposeInput,
): Promise<AIGenerateComposeOutput> {
  const { prompt, provider, apiKey, model, baseUrl, mode = 'generate', yaml } = input;

  const config: AIConfig = {
    provider,
    apiKey,
    model: model ?? DEFAULT_MODELS[provider],
    baseUrl,
  };

  const result = mode === 'optimize' && yaml
    ? await optimizeCompose(yaml, prompt, config)
    : await generateCompose(prompt, config);

  if (!result.success) {
    return { yaml: '', validation: [], error: result.error };
  }

  // Validate generated YAML
  const parseResult = parseYaml(result.yaml);
  if (!parseResult.success) {
    return {
      yaml: result.yaml,
      validation: [{ severity: 'warning', message: 'Generated YAML could not be parsed for validation' }],
    };
  }

  const issues = validate({ nodes: parseResult.nodes, edges: parseResult.edges });

  return {
    yaml: result.yaml,
    validation: issues.map((i) => ({
      severity: i.severity,
      message: i.message,
      ...(i.field && { field: i.field }),
    })),
  };
}
