import { describe, expect, it } from 'vitest';
import { validate } from '../validator';
import type { ServiceNode, DependencyEdge } from '../../store/types';

const makeNode = (id: string, serviceName: string, overrides?: Partial<ServiceNode['data']>): ServiceNode => ({
  id,
  type: 'serviceNode',
  position: { x: 0, y: 0 },
  data: {
    serviceName,
    image: 'some-image',
    preset: 'custom',
    ports: [],
    volumes: [],
    environment: {},
    networks: [],
    ...overrides,
  },
});

describe('validate', () => {
  // Rule 5: No services
  it('warns when no services defined', () => {
    const issues = validate({ nodes: [], edges: [] });
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('warning');
    expect(issues[0].message).toBe('No services defined yet.');
    expect(issues[0].nodeId).toBeUndefined();
  });

  // Rule 1: service_name uniqueness
  it('returns errors for duplicate service names', () => {
    const nodes = [makeNode('a', 'web'), makeNode('b', 'web')];
    const issues = validate({ nodes, edges: [] });
    const dupes = issues.filter((i) => i.field === 'serviceName');
    expect(dupes).toHaveLength(2);
    expect(dupes[0].severity).toBe('error');
    expect(dupes[0].message).toContain("'web'");
  });

  it('no error for unique service names', () => {
    const nodes = [makeNode('a', 'web'), makeNode('b', 'api')];
    const issues = validate({ nodes, edges: [] });
    const dupes = issues.filter((i) => i.field === 'serviceName');
    expect(dupes).toHaveLength(0);
  });

  // Rule 2: depends_on reference validity
  it('returns error when edge references nonexistent source', () => {
    const nodes = [makeNode('a', 'web')];
    const edges: DependencyEdge[] = [{ id: 'e1', source: 'deleted', target: 'a', type: 'dependencyEdge' }];
    const issues = validate({ nodes, edges });
    const refs = issues.filter((i) => i.message.includes('depends_on'));
    expect(refs).toHaveLength(1);
    expect(refs[0].severity).toBe('error');
    expect(refs[0].nodeId).toBe('a');
  });

  it('no error when edge source exists', () => {
    const nodes = [makeNode('a', 'db'), makeNode('b', 'api')];
    const edges: DependencyEdge[] = [{ id: 'e1', source: 'a', target: 'b', type: 'dependencyEdge' }];
    const issues = validate({ nodes, edges });
    const refs = issues.filter((i) => i.message.includes('depends_on'));
    expect(refs).toHaveLength(0);
  });

  // Rule 3: Port format
  it('warns for non-numeric ports', () => {
    const nodes = [makeNode('a', 'web', { ports: [{ host: 'abc', container: '80' }] })];
    const issues = validate({ nodes, edges: [] });
    const portIssues = issues.filter((i) => i.field === 'ports');
    expect(portIssues).toHaveLength(1);
    expect(portIssues[0].severity).toBe('warning');
    expect(portIssues[0].message).toContain("'abc'");
  });

  it('warns for non-numeric container port', () => {
    const nodes = [makeNode('a', 'web', { ports: [{ host: '80', container: 'xyz' }] })];
    const issues = validate({ nodes, edges: [] });
    const portIssues = issues.filter((i) => i.field === 'ports');
    expect(portIssues).toHaveLength(1);
    expect(portIssues[0].message).toContain("'xyz'");
  });

  it('no warning for valid numeric ports', () => {
    const nodes = [makeNode('a', 'web', { ports: [{ host: '8080', container: '80' }] })];
    const issues = validate({ nodes, edges: [] });
    const portIssues = issues.filter((i) => i.field === 'ports');
    expect(portIssues).toHaveLength(0);
  });

  // Rule 4: Empty image
  it('warns when image is empty', () => {
    const nodes = [makeNode('a', 'web', { image: '' })];
    const issues = validate({ nodes, edges: [] });
    const imgIssues = issues.filter((i) => i.field === 'image');
    expect(imgIssues).toHaveLength(1);
    expect(imgIssues[0].severity).toBe('warning');
    expect(imgIssues[0].message).toContain("'web'");
  });

  it('no warning when image is set', () => {
    const nodes = [makeNode('a', 'web', { image: 'nginx:latest' })];
    const issues = validate({ nodes, edges: [] });
    const imgIssues = issues.filter((i) => i.field === 'image');
    expect(imgIssues).toHaveLength(0);
  });
});
