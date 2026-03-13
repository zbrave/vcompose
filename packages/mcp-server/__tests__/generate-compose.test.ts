import { describe, it, expect } from 'vitest';
import { handleGenerateCompose } from '../src/tools/generate-compose';

describe('handleGenerateCompose', () => {
  it('generates YAML for known presets', async () => {
    const result = await handleGenerateCompose({ services: ['postgres', 'redis'] });
    expect(result.yaml).toContain('postgres:');
    expect(result.yaml).toContain('redis:');
    expect(result.yaml).toContain('image: postgres:16-alpine');
    expect(result.yaml).toContain('image: redis:7-alpine');
  });

  it('generates YAML for unknown services with fallback', async () => {
    const result = await handleGenerateCompose({ services: ['myapp'] });
    expect(result.yaml).toContain('myapp:');
    expect(result.yaml).toContain('image: myapp');
  });

  it('auto-detects edges from recommendation graph', async () => {
    const result = await handleGenerateCompose({ services: ['node', 'postgres', 'redis'] });
    expect(result.yaml).toContain('depends_on:');
  });

  it('creates default network when edges exist', async () => {
    const result = await handleGenerateCompose({ services: ['node', 'postgres'] });
    expect(result.yaml).toContain('networks:');
    expect(result.yaml).toContain('default:');
  });

  it('returns validation issues alongside YAML', async () => {
    const result = await handleGenerateCompose({ services: ['postgres', 'redis'] });
    expect(Array.isArray(result.validation)).toBe(true);
  });

  it('returns error for empty services list', async () => {
    const result = await handleGenerateCompose({ services: [] });
    expect(result.yaml).toBe('');
    expect(result.validation.length).toBeGreaterThan(0);
    expect(result.validation[0].severity).toBe('error');
    expect(result.validation[0].message).toContain('service');
  });

  it('generates YAML for recommendation-defaults services', async () => {
    const result = await handleGenerateCompose({ services: ['mongo', 'pgadmin'] });
    expect(result.yaml).toContain('image: mongo:7');
    expect(result.yaml).toContain('image: dpage/pgadmin4');
  });
});
