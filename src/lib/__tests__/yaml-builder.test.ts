import { generateId } from '../generate-id';
import { describe, expect, it } from 'vitest';
import { buildYaml } from '../yaml-builder';
import type { ServiceNode, DependencyEdge, NetworkConfig, NamedVolume } from '../../store/types';

function makeNode(overrides: { id?: string; data: Partial<ServiceNode['data']> & { serviceName: string } }): ServiceNode {
  const { id = generateId(), data } = overrides;
  return {
    id,
    type: 'serviceNode',
    position: { x: 0, y: 0 },
    data: {
      serviceName: data.serviceName,
      image: data.image ?? '',
      preset: data.preset ?? 'custom',
      ports: data.ports ?? [],
      volumes: data.volumes ?? [],
      environment: data.environment ?? {},
      networks: data.networks ?? [],
      ...(data.healthcheck ? { healthcheck: data.healthcheck } : {}),
    },
  };
}

const empty = { nodes: [] as ServiceNode[], edges: [] as DependencyEdge[], networks: [] as NetworkConfig[], namedVolumes: [] as NamedVolume[] };

describe('buildYaml', () => {
  it('includes vcompose.cc branding comment', () => {
    const yaml = buildYaml(empty);
    expect(yaml).toMatch(/^# Generated with VCompose/);
    expect(yaml).toContain('https://vcompose.cc');
  });

  it('returns empty services when no nodes', () => {
    const yaml = buildYaml(empty);
    expect(yaml).not.toContain('version');
    expect(yaml).toContain('services:');
  });

  it('includes image even when empty', () => {
    const yaml = buildYaml({ ...empty, nodes: [makeNode({ data: { serviceName: 'web', image: '' } })] });
    expect(yaml).toContain('image: ""');
  });

  it('renders ports correctly', () => {
    const yaml = buildYaml({ ...empty, nodes: [makeNode({ data: { serviceName: 'web', image: 'nginx', ports: [{ host: '8080', container: '80' }] } })] });
    expect(yaml).toContain('8080:80');
  });

  it('omits empty ports/volumes/environment', () => {
    const yaml = buildYaml({ ...empty, nodes: [makeNode({ data: { serviceName: 'web', image: 'nginx' } })] });
    expect(yaml).not.toContain('ports:');
    expect(yaml).not.toContain('volumes:');
    expect(yaml).not.toContain('environment:');
  });

  it('renders environment variables', () => {
    const yaml = buildYaml({ ...empty, nodes: [makeNode({ data: { serviceName: 'db', image: 'postgres', environment: { POSTGRES_DB: 'mydb' } } })] });
    expect(yaml).toContain('POSTGRES_DB: mydb');
  });

  it('renders healthcheck', () => {
    const yaml = buildYaml({ ...empty, nodes: [makeNode({ data: { serviceName: 'web', image: 'nginx', healthcheck: { test: 'CMD curl -f http://localhost', interval: '30s', timeout: '10s', retries: 3 } } })] });
    expect(yaml).toContain('healthcheck:');
    expect(yaml).toContain('interval: 30s');
    expect(yaml).toContain('retries: 3');
  });

  it('generates depends_on from edges', () => {
    const nodeA = makeNode({ id: 'a', data: { serviceName: 'postgres', image: 'postgres' } });
    const nodeB = makeNode({ id: 'b', data: { serviceName: 'api', image: 'node' } });
    const edge: DependencyEdge = { id: 'e1', source: 'a', target: 'b', type: 'dependencyEdge' };
    const yaml = buildYaml({ ...empty, nodes: [nodeA, nodeB], edges: [edge] });
    expect(yaml).toContain('depends_on:');
    expect(yaml).toContain('- postgres');
  });

  it('sorts services alphabetically', () => {
    const nodeZ = makeNode({ data: { serviceName: 'zebra', image: 'z' } });
    const nodeA = makeNode({ data: { serviceName: 'alpha', image: 'a' } });
    const yaml = buildYaml({ ...empty, nodes: [nodeZ, nodeA] });
    expect(yaml.indexOf('alpha:')).toBeLessThan(yaml.indexOf('zebra:'));
  });

  it('renders top-level networks', () => {
    const yaml = buildYaml({ ...empty, nodes: [makeNode({ data: { serviceName: 'web', image: 'nginx', networks: ['default'] } })], networks: [{ name: 'default', driver: 'bridge' }] });
    expect(yaml).toContain('networks:');
    expect(yaml).toContain('driver: bridge');
  });

  it('detects named volumes', () => {
    const yaml = buildYaml({ ...empty, nodes: [makeNode({ data: { serviceName: 'db', image: 'postgres', volumes: [{ source: 'pgdata', target: '/var/lib/postgresql/data' }] } })] });
    expect(yaml).toContain('pgdata:');
    expect(yaml).toContain('driver: local');
  });

  it('does not add bind mounts to top-level volumes', () => {
    const yaml = buildYaml({ ...empty, nodes: [makeNode({ data: { serviceName: 'web', image: 'nginx', volumes: [{ source: './data', target: '/data' }] } })] });
    const lines = yaml.split('\n');
    expect(lines.filter((l) => /^volumes:/.test(l))).toHaveLength(0);
  });

  it('deduplicates named volumes', () => {
    const n1 = makeNode({ data: { serviceName: 'a', image: 'x', volumes: [{ source: 'shared', target: '/d1' }] } });
    const n2 = makeNode({ data: { serviceName: 'b', image: 'y', volumes: [{ source: 'shared', target: '/d2' }] } });
    const yaml = buildYaml({ ...empty, nodes: [n1, n2] });
    const after = yaml.split(/^volumes:/m)[1];
    expect(after).toBeDefined();
    expect(after!.match(/shared:/g)).toHaveLength(1);
  });
});
