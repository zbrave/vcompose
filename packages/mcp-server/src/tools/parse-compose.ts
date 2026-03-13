import { parseYaml } from '../../../../src/lib/yaml-parser';

export interface ParseComposeInput {
  yaml: string;
}

export interface ParsedService {
  name: string;
  image: string;
  ports: string[];
  environment: Record<string, string>;
  dependsOn: string[];
  networks: string[];
}

export interface ParseComposeOutput {
  success: boolean;
  services: ParsedService[];
  networks: Array<{ name: string; driver: string }>;
  volumes: Array<{ name: string }>;
  errors: string[];
}

export async function handleParseCompose(
  input: ParseComposeInput,
): Promise<ParseComposeOutput> {
  const { yaml } = input;
  const result = parseYaml(yaml);

  if (!result.success) {
    return { success: false, services: [], networks: [], volumes: [], errors: result.errors };
  }

  const services: ParsedService[] = result.nodes.map((node) => {
    const deps = result.edges
      .filter((e) => e.target === node.id)
      .map((e) => {
        const src = result.nodes.find((n) => n.id === e.source);
        return src?.data.serviceName ?? '';
      })
      .filter(Boolean);

    return {
      name: node.data.serviceName,
      image: node.data.image,
      ports: node.data.ports.map((p) => `${p.host}:${p.container}`),
      environment: { ...node.data.environment },
      dependsOn: deps,
      networks: [...node.data.networks],
    };
  });

  return {
    success: true,
    services,
    networks: result.networks.map((n) => ({ name: n.name, driver: n.driver })),
    volumes: result.namedVolumes.map((v) => ({ name: v.name })),
    errors: [],
  };
}
