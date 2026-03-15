import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../store';

describe('store actions (Phase 9)', () => {
  beforeEach(() => {
    // Reset store — bypasses temporal middleware, which is fine for test setup
    useStore.setState({
      nodes: [], edges: [], networks: [],
      namedVolumes: [], selectedNodeId: null, validationIssues: [],
    });
  });

  describe('addServiceFromRegistry', () => {
    it('adds a node with registry defaults', () => {
      useStore.getState().addServiceFromRegistry('redis', { x: 100, y: 100 });
      const nodes = useStore.getState().nodes;
      expect(nodes.length).toBe(1);
      expect(nodes[0].data.image).toBe('redis:7-alpine');
      expect(nodes[0].data.preset).toBe('redis');
      expect(nodes[0].data.ports.length).toBeGreaterThan(0);
    });

    it('ignores unknown service key', () => {
      useStore.getState().addServiceFromRegistry('nonexistent', { x: 0, y: 0 });
      expect(useStore.getState().nodes.length).toBe(0);
    });
  });

  describe('addServiceFromHub', () => {
    it('creates minimal node for Hub-only result', () => {
      useStore.getState().addServiceFromHub(
        {
          name: 'someuser/myimage',
          slug: 'myimage',
          description: 'test',
          starCount: 5,
          pullCount: 100,
          isOfficial: false,
        },
        { x: 100, y: 100 },
      );
      const nodes = useStore.getState().nodes;
      expect(nodes.length).toBe(1);
      expect(nodes[0].data.preset).toBe('custom');
      expect(nodes[0].data.image).toBe('someuser/myimage');
    });
  });

  describe('addStack', () => {
    it('adds all services and edges for a stack', () => {
      useStore.getState().addStack('elk', { x: 100, y: 100 });
      const { nodes, edges } = useStore.getState();
      // ELK has 3 services: elasticsearch, logstash, kibana
      expect(nodes.length).toBe(3);
      // ELK has 2 edges: elasticsearch→logstash and elasticsearch→kibana
      expect(edges.length).toBeGreaterThanOrEqual(1);
    });

    it('creates default network', () => {
      useStore.getState().addStack('elk', { x: 100, y: 100 });
      const { networks, nodes } = useStore.getState();
      expect(networks.some((n) => n.name === 'default')).toBe(true);
      // All nodes should be in default network
      for (const node of nodes) {
        expect(node.data.networks).toContain('default');
      }
    });

    it('ignores unknown stack key', () => {
      useStore.getState().addStack('nonexistent', { x: 0, y: 0 });
      expect(useStore.getState().nodes.length).toBe(0);
    });
  });
});
