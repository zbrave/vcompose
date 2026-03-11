import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import type {
  AppStore,
  DependencyEdge,
  NamedVolume,
  NetworkConfig,
  ParseResult,
  PresetImageKey,
  ServiceNodeData,
  ValidationIssue,
} from './types';
import { PRESET_DEFAULTS } from './types';

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
        const id = crypto.randomUUID();
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
    }),
    {
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        networks: state.networks,
        namedVolumes: state.namedVolumes,
      }),
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
