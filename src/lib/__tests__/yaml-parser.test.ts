import { describe, it, expect } from 'vitest';
import { parseYaml } from '../yaml-parser';

describe('parseYaml', () => {
  it('returns error for invalid YAML', () => {
    const result = parseYaml('{{invalid');
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('Invalid YAML');
  });

  it('returns error when no services key', () => {
    const result = parseYaml('version: "3.8"\nfoo: bar');
    expect(result.success).toBe(false);
    expect(result.errors).toContain('No services found');
  });

  it('parses minimal service with image only', () => {
    const yaml = `
services:
  web:
    image: nginx:alpine
`;
    const result = parseYaml(yaml);
    expect(result.success).toBe(true);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].data.serviceName).toBe('web');
    expect(result.nodes[0].data.image).toBe('nginx:alpine');
    expect(result.nodes[0].data.preset).toBe('nginx');
  });

  it('parses ports in host:container format', () => {
    const yaml = `
services:
  web:
    image: nginx
    ports:
      - "8080:80"
`;
    const result = parseYaml(yaml);
    expect(result.nodes[0].data.ports).toEqual([{ host: '8080', container: '80' }]);
  });

  it('strips protocol from ports', () => {
    const yaml = `
services:
  web:
    image: nginx
    ports:
      - "80:80/tcp"
`;
    const result = parseYaml(yaml);
    expect(result.nodes[0].data.ports).toEqual([{ host: '80', container: '80' }]);
  });

  it('parses volumes', () => {
    const yaml = `
services:
  db:
    image: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init:/docker-entrypoint-initdb.d
`;
    const result = parseYaml(yaml);
    expect(result.nodes[0].data.volumes).toHaveLength(2);
    expect(result.nodes[0].data.volumes[0]).toEqual({
      source: 'pgdata',
      target: '/var/lib/postgresql/data',
    });
  });

  it('parses environment as object', () => {
    const yaml = `
services:
  db:
    image: postgres
    environment:
      POSTGRES_USER: admin
      POSTGRES_DB: mydb
`;
    const result = parseYaml(yaml);
    expect(result.nodes[0].data.environment).toEqual({
      POSTGRES_USER: 'admin',
      POSTGRES_DB: 'mydb',
    });
  });

  it('parses environment as array', () => {
    const yaml = `
services:
  db:
    image: postgres
    environment:
      - POSTGRES_USER=admin
      - POSTGRES_DB=mydb
`;
    const result = parseYaml(yaml);
    expect(result.nodes[0].data.environment).toEqual({
      POSTGRES_USER: 'admin',
      POSTGRES_DB: 'mydb',
    });
  });

  it('parses healthcheck', () => {
    const yaml = `
services:
  web:
    image: nginx
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
`;
    const result = parseYaml(yaml);
    expect(result.nodes[0].data.healthcheck).toEqual({
      test: 'CMD curl -f http://localhost',
      interval: '30s',
      timeout: '10s',
      retries: 3,
    });
  });

  it('parses depends_on as array and creates edges', () => {
    const yaml = `
services:
  db:
    image: postgres
  web:
    image: nginx
    depends_on:
      - db
`;
    const result = parseYaml(yaml);
    expect(result.edges).toHaveLength(1);
    const dbNode = result.nodes.find((n) => n.data.serviceName === 'db')!;
    const webNode = result.nodes.find((n) => n.data.serviceName === 'web')!;
    expect(result.edges[0].source).toBe(dbNode.id);
    expect(result.edges[0].target).toBe(webNode.id);
  });

  it('parses depends_on as object', () => {
    const yaml = `
services:
  db:
    image: postgres
  web:
    image: nginx
    depends_on:
      db:
        condition: service_healthy
`;
    const result = parseYaml(yaml);
    expect(result.edges).toHaveLength(1);
  });

  it('parses top-level networks', () => {
    const yaml = `
services:
  web:
    image: nginx
networks:
  frontend:
    driver: bridge
  backend:
    driver: overlay
`;
    const result = parseYaml(yaml);
    expect(result.networks).toHaveLength(2);
    expect(result.networks[0]).toEqual({ name: 'frontend', driver: 'bridge' });
    expect(result.networks[1]).toEqual({ name: 'backend', driver: 'overlay' });
  });

  it('parses top-level volumes', () => {
    const yaml = `
services:
  db:
    image: postgres
volumes:
  pgdata:
    driver: local
`;
    const result = parseYaml(yaml);
    expect(result.namedVolumes).toHaveLength(1);
    expect(result.namedVolumes[0]).toEqual({ name: 'pgdata', driver: 'local' });
  });

  it('auto-layouts nodes in grid', () => {
    const yaml = `
services:
  a:
    image: nginx
  b:
    image: nginx
  c:
    image: nginx
  d:
    image: nginx
`;
    const result = parseYaml(yaml);
    expect(result.nodes[0].position).toEqual({ x: 50, y: 50 });
    expect(result.nodes[1].position).toEqual({ x: 300, y: 50 });
    expect(result.nodes[2].position).toEqual({ x: 550, y: 50 });
    expect(result.nodes[3].position).toEqual({ x: 50, y: 200 }); // wraps to row 2
  });

  it('detects preset from image name', () => {
    const yaml = `
services:
  db:
    image: postgres:16-alpine
  cache:
    image: redis:7
  app:
    image: node:20
  custom:
    image: myapp:latest
`;
    const result = parseYaml(yaml);
    expect(result.nodes.find((n) => n.data.serviceName === 'db')!.data.preset).toBe('postgres');
    expect(result.nodes.find((n) => n.data.serviceName === 'cache')!.data.preset).toBe('redis');
    expect(result.nodes.find((n) => n.data.serviceName === 'app')!.data.preset).toBe('node');
    expect(result.nodes.find((n) => n.data.serviceName === 'custom')!.data.preset).toBe('custom');
  });

  it('handles empty services object', () => {
    const yaml = `
services: {}
`;
    const result = parseYaml(yaml);
    expect(result.success).toBe(true);
    expect(result.nodes).toHaveLength(0);
  });

  it('parses service-level networks', () => {
    const yaml = `
services:
  web:
    image: nginx
    networks:
      - frontend
      - backend
`;
    const result = parseYaml(yaml);
    expect(result.nodes[0].data.networks).toEqual(['frontend', 'backend']);
  });
});
