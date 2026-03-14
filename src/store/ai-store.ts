import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIConfig, AIProviderKey } from '../lib/ai/ai-types';
import { DEFAULT_AI_CONFIG, DEFAULT_MODELS } from '../lib/ai/ai-types';

export interface AIStore {
  config: AIConfig;
  isLoading: boolean;
  error: string | null;
  setProvider: (provider: AIProviderKey) => void;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setBaseUrl: (url: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAIStore = create<AIStore>()(
  persist(
    (set) => ({
      config: { ...DEFAULT_AI_CONFIG },
      isLoading: false,
      error: null,

      setProvider: (provider) =>
        set((state) => ({
          config: {
            ...state.config,
            provider,
            model: DEFAULT_MODELS[provider],
          },
        })),

      setApiKey: (apiKey) =>
        set((state) => ({
          config: { ...state.config, apiKey },
        })),

      setModel: (model) =>
        set((state) => ({
          config: { ...state.config, model },
        })),

      setBaseUrl: (baseUrl) =>
        set((state) => ({
          config: { ...state.config, baseUrl },
        })),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'vdc-ai-config',
      partialize: (state) => ({ config: state.config }),
    },
  ),
);
