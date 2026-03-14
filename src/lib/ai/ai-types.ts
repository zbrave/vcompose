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

export const DEFAULT_MODELS: Record<AIProviderKey, string> = {
  anthropic: 'claude-sonnet-4-5',
  openai: 'gpt-4.1',
  gemini: 'gemini-2.5-flash',
  glm: 'glm-4.7',
};

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4.1',
};
