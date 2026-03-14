import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { AIConfig, AIGenerateResult } from './ai-types';
import { extractYaml } from './yaml-extractor';
import {
  GENERATE_SYSTEM_PROMPT,
  OPTIMIZE_SYSTEM_PROMPT,
  buildGeneratePrompt,
  buildOptimizePrompt,
} from './prompt-templates';

function createProviderModel(config: AIConfig) {
  switch (config.provider) {
    case 'anthropic': {
      const anthropic = createAnthropic({
        apiKey: config.apiKey,
      });
      return anthropic(config.model);
    }
    case 'openai': {
      const openai = createOpenAI({
        apiKey: config.apiKey,
        ...(config.baseUrl && { baseURL: config.baseUrl }),
      });
      return openai(config.model);
    }
    case 'gemini': {
      const google = createGoogleGenerativeAI({
        apiKey: config.apiKey,
      });
      return google(config.model);
    }
    case 'glm': {
      const glm = createOpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl ?? 'https://open.bigmodel.cn/api/paas/v4/',
      });
      return glm(config.model);
    }
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

function isCorsError(error: unknown): boolean {
  return error instanceof TypeError && String(error.message).toLowerCase().includes('fetch');
}

async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  config: AIConfig,
): Promise<AIGenerateResult> {
  try {
    const model = createProviderModel(config);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      const { text } = await generateText({
        model,
        system: systemPrompt,
        prompt: userPrompt,
        abortSignal: controller.signal,
      });

      const yaml = extractYaml(text);
      return { success: true, yaml };
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: unknown) {
    if (isCorsError(error)) {
      return {
        success: false,
        yaml: '',
        error: 'This provider may not work directly from the browser. Try using it via the MCP server instead.',
      };
    }
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, yaml: '', error: 'Request timed out after 60 seconds.' };
    }
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, yaml: '', error: message };
  }
}

export async function generateCompose(
  prompt: string,
  config: AIConfig,
): Promise<AIGenerateResult> {
  return callLLM(GENERATE_SYSTEM_PROMPT, buildGeneratePrompt(prompt), config);
}

export async function optimizeCompose(
  existingYaml: string,
  prompt: string,
  config: AIConfig,
): Promise<AIGenerateResult> {
  return callLLM(OPTIMIZE_SYSTEM_PROMPT, buildOptimizePrompt(existingYaml, prompt), config);
}
