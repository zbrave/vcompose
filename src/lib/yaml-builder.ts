import { stringify } from 'yaml';
import type { AppStore } from '../store/types';

type BuildYamlInput = Pick<AppStore, 'nodes' | 'edges' | 'networks' | 'namedVolumes'>;

export function buildYaml(store: BuildYamlInput): string {
  const { nodes, edges, networks, namedVolumes } = store;

  // Sort services alphabetically
  const sortedNodes = [...nodes].sort((a, b) =>
    a.data.serviceName.localeCompare(b.data.serviceName),
  );

  // Build services
  const services: Record<string, unknown> = {};
  for (const node of sortedNodes) {
    const svc: Record<string, unknown> = {};
    svc.image = node.data.image || '';

    // Ports
    if (node.data.ports.length > 0) {
      svc.ports = node.data.ports.map((p) => `${p.host}:${p.container}`);
    }

    // Volumes
    if (node.data.volumes.length > 0) {
      svc.volumes = node.data.volumes.map((v) => `${v.source}:${v.target}`);
    }

    // Environment
    if (Object.keys(node.data.environment).length > 0) {
      svc.environment = { ...node.data.environment };
    }

    // Healthcheck
    if (node.data.healthcheck) {
      const hc = node.data.healthcheck;
      svc.healthcheck = {
        test: ['CMD', ...hc.test.replace(/^CMD\s*/, '').split(/\s+/)],
        interval: hc.interval,
        timeout: hc.timeout,
        retries: hc.retries,
      };
    }

    // depends_on from edges
    const deps = edges
      .filter((e) => e.target === node.id)
      .map((e) => {
        const sourceNode = nodes.find((n) => n.id === e.source);
        return sourceNode?.data.serviceName;
      })
      .filter(Boolean) as string[];

    if (deps.length > 0) {
      svc.depends_on = deps;
    }

    // Networks
    if (node.data.networks.length > 0) {
      svc.networks = [...node.data.networks];
    }

    services[node.data.serviceName] = svc;
  }

  // Build document
  const doc: Record<string, unknown> = {
    version: '3.8',
    services,
  };

  // Top-level networks
  if (networks.length > 0) {
    const nets: Record<string, unknown> = {};
    for (const net of networks) {
      nets[net.name] = { driver: net.driver };
    }
    doc.networks = nets;
  }

  // Top-level named volumes (from volume mappings + explicit named volumes)
  const allNamedVols = new Set<string>();

  // Detect named volumes from service volume mappings
  for (const node of nodes) {
    for (const vol of node.data.volumes) {
      if (!vol.source.includes('/') && !vol.source.startsWith('.')) {
        allNamedVols.add(vol.source);
      }
    }
  }

  // Add explicitly registered named volumes
  for (const nv of namedVolumes) {
    allNamedVols.add(nv.name);
  }

  if (allNamedVols.size > 0) {
    const vols: Record<string, unknown> = {};
    for (const name of [...allNamedVols].sort()) {
      const explicit = namedVolumes.find((v) => v.name === name);
      vols[name] = { driver: explicit?.driver ?? 'local' };
    }
    doc.volumes = vols;
  }

  return stringify(doc, { lineWidth: 0 });
}
