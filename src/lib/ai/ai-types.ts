export type AIProviderKey = 'anthropic' | 'openai' | 'gemini' | 'glm';

export interface AIConfig {
  provider: AIProviderKey;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface AIGenerateResult {
  success: boolean;
  yaml: string;
  error?: string;
}

export const PROVIDER_MODELS: Record<AIProviderKey, { id: string; label: string }[]> = {
  openai: [
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { id: 'o3', label: 'o3' },
    { id: 'o4-mini', label: 'o4-mini' },
  ],
  anthropic: [
    { id: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
    { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
  ],
  gemini: [
    { id: 'gemini-flash-latest', label: 'Gemini Flash (latest)' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  ],
  glm: [
    { id: 'glm-4.7', label: 'GLM-4.7' },
    { id: 'glm-5', label: 'GLM-5' },
  ],
};

export const DEFAULT_MODELS: Record<AIProviderKey, string> = {
  anthropic: PROVIDER_MODELS.anthropic[0].id,
  openai: PROVIDER_MODELS.openai[0].id,
  gemini: PROVIDER_MODELS.gemini[0].id,
  glm: PROVIDER_MODELS.glm[0].id,
};

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4.1',
};
