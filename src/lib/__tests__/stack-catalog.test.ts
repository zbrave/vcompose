import { describe, it, expect } from 'vitest';
import { STACK_CATALOG } from '../../data/stack-catalog';
import { SERVICE_REGISTRY } from '../../data/service-registry';

describe('stack-catalog', () => {
  const registryKeys = new Set(SERVICE_REGISTRY.map(s => s.key));

  it('has 16 stacks', () => {
    expect(STACK_CATALOG.length).toBe(16);
  });

  it('has no duplicate keys', () => {
    const keys = STACK_CATALOG.map(s => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('all service refs point to existing registry keys', () => {
    for (const stack of STACK_CATALOG) {
      for (const svcRef of stack.services) {
        expect(registryKeys.has(svcRef.serviceKey),
          `Stack "${stack.key}" references unknown service "${svcRef.serviceKey}"`
        ).toBe(true);
      }
    }
  });

  it('all edge refs point to services within the stack', () => {
    for (const stack of STACK_CATALOG) {
      const stackServiceKeys = new Set(stack.services.map(s => s.serviceKey));
      for (const edge of stack.edges) {
        expect(stackServiceKeys.has(edge.source),
          `Stack "${stack.key}" edge source "${edge.source}" not in stack services`
        ).toBe(true);
        expect(stackServiceKeys.has(edge.target),
          `Stack "${stack.key}" edge target "${edge.target}" not in stack services`
        ).toBe(true);
      }
    }
  });

  it('every stack has at least 2 services', () => {
    for (const stack of STACK_CATALOG) {
      expect(stack.services.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('no duplicate gridPositions within a stack', () => {
    for (const stack of STACK_CATALOG) {
      const positions = stack.services.map(s => `${s.gridPosition.col},${s.gridPosition.row}`);
      expect(new Set(positions).size).toBe(positions.length);
    }
  });

  it('every stack has required fields', () => {
    for (const stack of STACK_CATALOG) {
      expect(stack.key).toBeTruthy();
      expect(stack.name).toBeTruthy();
      expect(stack.icon).toBeTruthy();
      expect(stack.description).toBeTruthy();
      expect(stack.tags.length).toBeGreaterThan(0);
    }
  });
});
