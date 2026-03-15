import { describe, it, expect } from 'vitest';
import { SERVICE_REGISTRY } from '../../data/service-registry';

describe('service-registry', () => {
  it('has no duplicate keys', () => {
    const keys = SERVICE_REGISTRY.map(s => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every service has required fields', () => {
    for (const svc of SERVICE_REGISTRY) {
      expect(svc.key).toBeTruthy();
      expect(svc.name).toBeTruthy();
      expect(svc.image).toBeTruthy();
      expect(svc.category).toBeTruthy();
      expect(svc.preset).toBeTruthy();
      expect(Array.isArray(svc.ports)).toBe(true);
    }
  });

  it('preset services map to their own preset key', () => {
    const presetKeys = ['nginx', 'postgres', 'redis', 'node', 'custom'];
    for (const key of presetKeys) {
      const svc = SERVICE_REGISTRY.find(s => s.key === key);
      expect(svc).toBeDefined();
      expect(svc!.preset).toBe(key);
    }
  });

  it('non-preset services have preset "custom"', () => {
    const presetKeys = new Set(['nginx', 'postgres', 'redis', 'node', 'custom']);
    const nonPresets = SERVICE_REGISTRY.filter(s => !presetKeys.has(s.key));
    for (const svc of nonPresets) {
      expect(svc.preset).toBe('custom');
    }
  });

  it('ports have valid host and container strings', () => {
    for (const svc of SERVICE_REGISTRY) {
      for (const port of svc.ports) {
        expect(port.host).toMatch(/^\d+$/);
        expect(port.container).toMatch(/^\d+$/);
      }
    }
  });

  it('has at least 50 services', () => {
    expect(SERVICE_REGISTRY.length).toBeGreaterThanOrEqual(50);
  });
});
