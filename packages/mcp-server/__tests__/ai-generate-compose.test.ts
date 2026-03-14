import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleAIGenerateCompose } from '../src/tools/ai-generate-compose';

// Mock AI provider
vi.mock('@vdc/lib/ai/ai-provider', () => ({
  generateCompose: vi.fn(),
  optimizeCompose: vi.fn(),
}));

// Mock parseYaml and validate
vi.mock('@vdc/lib/yaml-parser', () => ({
  parseYaml: vi.fn(() => ({
    success: true,
    nodes: [{ id: '1', type: 'serviceNode', position: { x: 0, y: 0 }, data: { serviceName: 'web', image: 'nginx', preset: 'nginx', ports: [], volumes: [], environment: {}, networks: [] } }],
    edges: [],
    networks: [],
    namedVolumes: [],
    errors: [],
  })),
}));

vi.mock('@vdc/lib/validator', () => ({
  validate: vi.fn(() => []),
}));

describe('handleAIGenerateCompose', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls generateCompose in generate mode and returns validation', async () => {
    const { generateCompose } = await import('@vdc/lib/ai/ai-provider');
    vi.mocked(generateCompose).mockResolvedValueOnce({
      success: true,
      yaml: 'version: "3.8"\nservices:\n  web:\n    image: nginx',
    });

    const result = await handleAIGenerateCompose({
      prompt: 'web server',
      provider: 'openai',
      apiKey: 'test-key',
      mode: 'generate',
    });

    expect(result.yaml).toContain('nginx');
    expect(Array.isArray(result.validation)).toBe(true);
    expect(generateCompose).toHaveBeenCalled();
  });

  it('calls optimizeCompose in optimize mode', async () => {
    const { optimizeCompose } = await import('@vdc/lib/ai/ai-provider');
    vi.mocked(optimizeCompose).mockResolvedValueOnce({
      success: true,
      yaml: 'version: "3.8"\nservices:\n  web:\n    image: nginx:alpine',
    });

    const result = await handleAIGenerateCompose({
      prompt: 'optimize',
      provider: 'openai',
      apiKey: 'test-key',
      mode: 'optimize',
      yaml: 'version: "3.8"\nservices:\n  web:\n    image: nginx',
    });

    expect(result.yaml).toContain('nginx:alpine');
    expect(Array.isArray(result.validation)).toBe(true);
    expect(optimizeCompose).toHaveBeenCalled();
  });

  it('returns error when AI fails', async () => {
    const { generateCompose } = await import('@vdc/lib/ai/ai-provider');
    vi.mocked(generateCompose).mockResolvedValueOnce({
      success: false,
      yaml: '',
      error: 'API error',
    });

    const result = await handleAIGenerateCompose({
      prompt: 'test',
      provider: 'openai',
      apiKey: 'test-key',
    });

    expect(result.error).toBe('API error');
  });
});
