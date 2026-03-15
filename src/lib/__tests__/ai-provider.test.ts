import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCompose, optimizeCompose } from '../ai/ai-provider';
import type { AIConfig } from '../ai/ai-types';

// Mock the 'ai' module
vi.mock('ai', () => ({
  generateText: vi.fn(),
}));

// Mock provider SDKs
vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => vi.fn(() => 'mock-model')),
}));
vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => vi.fn(() => 'mock-model')),
}));
vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn(() => 'mock-model')),
}));

const baseConfig: AIConfig = {
  provider: 'openai',
  apiKey: 'test-key',
  model: 'gpt-4.1',
};

describe('generateCompose', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns YAML on successful generation', async () => {
    const { generateText } = await import('ai');
    vi.mocked(generateText).mockResolvedValueOnce({
      text: '```yaml\nversion: "3.8"\nservices:\n  web:\n    image: nginx\n```',
    } as never);

    const result = await generateCompose('web server with nginx', baseConfig);
    expect(result.success).toBe(true);
    expect(result.yaml).toContain('nginx');
  });

  it('returns error on API failure', async () => {
    const { generateText } = await import('ai');
    vi.mocked(generateText).mockRejectedValueOnce(new Error('Invalid API key'));

    const result = await generateCompose('test', baseConfig);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid API key');
  });

  it('detects CORS-like errors', async () => {
    const { generateText } = await import('ai');
    const corsError = new TypeError('Failed to fetch');
    vi.mocked(generateText).mockRejectedValueOnce(corsError);

    const result = await generateCompose('test', baseConfig);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });

  it('handles timeout errors', async () => {
    const { generateText } = await import('ai');
    const abortError = new Error('AbortError');
    abortError.name = 'AbortError';
    vi.mocked(generateText).mockRejectedValueOnce(abortError);

    const result = await generateCompose('test', baseConfig);
    expect(result.success).toBe(false);
    expect(result.error).toContain('timed out');
  });
});

describe('optimizeCompose', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('includes existing YAML in the prompt', async () => {
    const { generateText } = await import('ai');
    vi.mocked(generateText).mockResolvedValueOnce({
      text: '```yaml\nversion: "3.8"\nservices:\n  web:\n    image: nginx:alpine\n```',
    } as never);

    const result = await optimizeCompose('version: "3.8"\nservices:\n  web:\n    image: nginx', 'optimize', baseConfig);
    expect(result.success).toBe(true);
    expect(result.yaml).toContain('nginx');

    expect(vi.mocked(generateText)).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('version: "3.8"'),
      }),
    );
  });
});
