import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import { generateId } from '../lib/generate-id';
import type {
  AppStore,
  DependencyEdge,
  NamedVolume,
  NetworkConfig,
  ParseResult,
  PortMapping,
  PresetImageKey,
  ServiceNodeData,
  ValidationIssue,
  VolumeMapping,
} from './types';
import { PRESET_DEFAULTS } from './types';
import { SERVICE_REGISTRY } from '../data/service-registry';
import { STACK_CATALOG } from '../data/stack-catalog';
import { calculateStackLayout } from '../lib/stack-layout';
import type { DockerHubSearchResult } from '../data/types';

export const useStore = create<AppStore>()(
  persist(
    temporal(
    (set) => ({
      // State
      nodes: [],
      edges: [],
      networks: [],
      namedVolumes: [],
      selectedNodeId: null,
      validationIssues: [],

      // Node actions
      addNode: (preset: PresetImageKey, position: { x: number; y: number }) => {
        const defaults = PRESET_DEFAULTS[preset];
        const id = generateId();
        const node = {
          id,
          type: 'serviceNode' as const,
          position,
          data: {
            serviceName: `${preset}-${id.slice(0, 4)}`,
            image: defaults.image ?? '',
            preset,
            ports: defaults.ports ? [...defaults.ports] : [],
            volumes: [],
            environment: defaults.environment ? { ...defaults.environment } : {},
            networks: [],
          } satisfies ServiceNodeData,
        };
        set((state) => ({ nodes: [...state.nodes, node] }));
      },

      updateNode: (id: string, data: Partial<ServiceNodeData>) => {
        set((state) => ({
          nodes: state.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n)),
        }));
      },

      removeNode: (id: string) => {
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== id),
          edges: state.edges.filter((e) => e.source !== id && e.target !== id),
          selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        }));
      },

      selectNode: (id: string | null) => {
        set({ selectedNodeId: id });
      },

      // Edge actions
      addEdge: (edge: DependencyEdge) => {
        set((state) => {
          const newEdges = [...state.edges, edge];

          // Auto-create default network if it doesn't exist
          let newNetworks = state.networks;
          if (!state.networks.some((n) => n.name === 'default')) {
            newNetworks = [...state.networks, { name: 'default', driver: 'bridge' }];
          }

          // Add both nodes to default network
          const newNodes = state.nodes.map((n) => {
            if (n.id === edge.source || n.id === edge.target) {
              if (!n.data.networks.includes('default')) {
                return { ...n, data: { ...n.data, networks: [...n.data.networks, 'default'] } };
              }
            }
            return n;
          });

          return { edges: newEdges, networks: newNetworks, nodes: newNodes };
        });
      },

      removeEdge: (id: string) => {
        set((state) => ({ edges: state.edges.filter((e) => e.id !== id) }));
      },

      // Network actions
      addNetwork: (network: NetworkConfig) => {
        set((state) => ({ networks: [...state.networks, network] }));
      },

      updateNetwork: (oldName: string, network: NetworkConfig) => {
        set((state) => ({
          networks: state.networks.map((n) => (n.name === oldName ? network : n)),
          nodes:
            oldName !== network.name
              ? state.nodes.map((n) => ({
                  ...n,
                  data: {
                    ...n.data,
                    networks: n.data.networks.map((net) => (net === oldName ? network.name : net)),
                  },
                }))
              : state.nodes,
        }));
      },

      removeNetwork: (name: string) => {
        set((state) => ({
          networks: state.networks.filter((n) => n.name !== name),
          nodes: state.nodes.map((n) => ({
            ...n,
            data: {
              ...n.data,
              networks: n.data.networks.filter((net) => net !== name),
            },
          })),
        }));
      },

      // Named volume actions
      addNamedVolume: (volume: NamedVolume) => {
        set((state) => ({ namedVolumes: [...state.namedVolumes, volume] }));
      },

      removeNamedVolume: (name: string) => {
        set((state) => ({ namedVolumes: state.namedVolumes.filter((v) => v.name !== name) }));
      },

      // Validation
      setValidationIssues: (issues: ValidationIssue[]) => {
        set({ validationIssues: issues });
      },

      // Recommendations
      addRecommendedNode: (key: string, sourceNodeId: string, position: { x: number; y: number }) => {
        const presetKeys = ['nginx', 'postgres', 'redis', 'node', 'custom'] as const;
        const isPreset = (presetKeys as readonly string[]).includes(key);
        const registryDef = !isPreset ? SERVICE_REGISTRY.find((s) => s.key === key) : undefined;
        const preset: PresetImageKey = isPreset
          ? (key as PresetImageKey)
          : registryDef?.preset ?? 'custom';
        const defaults = isPreset
          ? PRESET_DEFAULTS[key as PresetImageKey]
          : registryDef ?? { image: key, ports: [] };

        const id = generateId();
        const node = {
          id,
          type: 'serviceNode' as const,
          position,
          data: {
            serviceName: `${key}-${id.slice(0, 4)}`,
            image: defaults?.image ?? key,
            preset,
            ports: defaults?.ports ? [...defaults.ports] : [],
            volumes: defaults?.volumes ? [...defaults.volumes] : [],
            environment: defaults?.environment ? { ...defaults.environment } : {},
            networks: [] as string[],
          } satisfies ServiceNodeData,
        };

        set((state) => {
          const newNodes = [...state.nodes, node];

          // Auto-create default network if needed
          let newNetworks = state.networks;
          if (!state.networks.some((n) => n.name === 'default')) {
            newNetworks = [...state.networks, { name: 'default', driver: 'bridge' }];
          }

          // Add both source and new node to default network
          const updatedNodes = newNodes.map((n) => {
            if ((n.id === sourceNodeId || n.id === id) && !n.data.networks.includes('default')) {
              return { ...n, data: { ...n.data, networks: [...n.data.networks, 'default'] } };
            }
            return n;
          });

          const edgeId = generateId();
          const newEdge: DependencyEdge = {
            id: edgeId,
            source: sourceNodeId,
            target: id,
            type: 'dependencyEdge',
          };

          return {
            nodes: updatedNodes,
            edges: [...state.edges, newEdge],
            networks: newNetworks,
          };
        });
      },

      // Import
      importCompose: (result: ParseResult) => {
        set({
          nodes: result.nodes,
          edges: result.edges,
          networks: result.networks,
          namedVolumes: result.namedVolumes,
          selectedNodeId: null,
          validationIssues: [],
        });
      },

      // Stack & Marketplace actions
      addServiceFromRegistry: (serviceKey: string, position: { x: number; y: number }) => {
        const serviceDef = SERVICE_REGISTRY.find((s) => s.key === serviceKey);
        if (!serviceDef) return;

        const id = generateId();
        const node = {
          id,
          type: 'serviceNode' as const,
          position,
          data: {
            serviceName: `${serviceKey}-${id.slice(0, 4)}`,
            image: serviceDef.image,
            preset: serviceDef.preset,
            ports: serviceDef.ports ? [...serviceDef.ports] : [],
            volumes: serviceDef.volumes ? [...serviceDef.volumes] : [],
            environment: serviceDef.environment ? { ...serviceDef.environment } : {},
            networks: [] as string[],
          } satisfies ServiceNodeData,
        };
        set((state) => ({ nodes: [...state.nodes, node] }));
      },

      addServiceFromHub: (hubResult: DockerHubSearchResult, position: { x: number; y: number }) => {
        if (hubResult.registryMatch) {
          // Delegate to registry-based creation
          const serviceDef = hubResult.registryMatch;
          const id = generateId();
          const node = {
            id,
            type: 'serviceNode' as const,
            position,
            data: {
              serviceName: `${serviceDef.key}-${id.slice(0, 4)}`,
              image: serviceDef.image,
              preset: serviceDef.preset,
              ports: serviceDef.ports ? [...serviceDef.ports] : [],
              volumes: serviceDef.volumes ? [...serviceDef.volumes] : [],
              environment: serviceDef.environment ? { ...serviceDef.environment } : {},
              networks: [] as string[],
            } satisfies ServiceNodeData,
          };
          set((state) => ({ nodes: [...state.nodes, node] }));
        } else {
          // Create minimal custom node from Docker Hub result
          const id = generateId();
          const node = {
            id,
            type: 'serviceNode' as const,
            position,
            data: {
              serviceName: `${hubResult.slug.replace(/\//g, '-')}-${id.slice(0, 4)}`,
              image: hubResult.name,
              preset: 'custom' as const,
              ports: [] as PortMapping[],
              volumes: [] as VolumeMapping[],
              environment: {} as Record<string, string>,
              networks: [] as string[],
            } satisfies ServiceNodeData,
          };
          set((state) => ({ nodes: [...state.nodes, node] }));
        }
      },

      addStack: (stackKey: string, dropPosition: { x: number; y: number }) => {
        const stack = STACK_CATALOG.find((s) => s.key === stackKey);
        if (!stack) return;

        const layout = calculateStackLayout(stack, {
          startX: dropPosition.x,
          startY: dropPosition.y,
          nodeWidth: 180,
          nodeHeight: 80,
          gapX: 220,
          gapY: 150,
        });

        // Build service key → node id map and node list
        const keyToIdMap: Record<string, string> = {};
        const newNodes: Array<{
          id: string;
          type: 'serviceNode';
          position: { x: number; y: number };
          data: ServiceNodeData;
        }> = [];

        for (const layoutNode of layout.nodes) {
          const serviceDef = SERVICE_REGISTRY.find((s) => s.key === layoutNode.serviceKey);
          if (!serviceDef) continue;

          const svcRef = stack.services.find((s) => s.serviceKey === layoutNode.serviceKey);
          const id = generateId();
          keyToIdMap[layoutNode.serviceKey] = id;

          // Merge overrides if present
          const image = svcRef?.overrides?.image ?? serviceDef.image;
          const ports = svcRef?.overrides?.ports ?? serviceDef.ports;
          const volumes = svcRef?.overrides?.volumes ?? serviceDef.volumes;
          const environment = svcRef?.overrides?.environment ?? serviceDef.environment;
          const healthcheck = svcRef?.overrides?.healthcheck ?? serviceDef.healthcheck;

          newNodes.push({
            id,
            type: 'serviceNode' as const,
            position: layoutNode.position,
            data: {
              serviceName: `${layoutNode.serviceKey}-${id.slice(0, 4)}`,
              image,
              preset: serviceDef.preset,
              ports: ports ? [...ports] : [],
              volumes: volumes ? [...volumes] : [],
              environment: environment ? { ...environment } : {},
              ...(healthcheck ? { healthcheck: { ...healthcheck } } : {}),
              networks: ['default'],
            } satisfies ServiceNodeData,
          });
        }

        // Build edges from stack edge refs
        const newEdges: DependencyEdge[] = [];
        for (const edgeRef of stack.edges) {
          const sourceId = keyToIdMap[edgeRef.source];
          const targetId = keyToIdMap[edgeRef.target];
          if (sourceId && targetId) {
            newEdges.push({
              id: generateId(),
              source: sourceId,
              target: targetId,
              type: 'dependencyEdge',
            });
          }
        }

        // Single atomic set() call for undo
        set((state) => {
          let newNetworks = state.networks;
          if (!state.networks.some((n) => n.name === 'default')) {
            newNetworks = [...state.networks, { name: 'default', driver: 'bridge' as const }];
          }
          return {
            nodes: [...state.nodes, ...newNodes],
            edges: [...state.edges, ...newEdges],
            networks: newNetworks,
          };
        });
      },
    }),
    {
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        networks: state.networks,
        namedVolumes: state.namedVolumes,
      }),
      equality: (pastState, currentState) =>
        JSON.stringify(pastState) === JSON.stringify(currentState),
    },
    ),
    {
      name: 'vdc-store',
      version: 1,
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        networks: state.networks,
        namedVolumes: state.namedVolumes,
      }),
    },
  ),
);
