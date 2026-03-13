import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { handleGenerateCompose } from './tools/generate-compose.js';
import { handleValidateCompose } from './tools/validate-compose.js';
import { handleParseCompose } from './tools/parse-compose.js';
import { handleGetRecommendations } from './tools/get-recommendations.js';

const server = new McpServer({
  name: 'docker-compose-mcp',
  version: '1.0.0',
});

// Tool 1: generate-compose
server.registerTool(
  'generate-compose',
  {
    title: 'Generate Docker Compose',
    description:
      'Generate a docker-compose.yml from a list of service names. Automatically configures images, ports, environment variables, dependencies, and networks.',
    inputSchema: {
      services: z.array(z.string()).describe('Service names (e.g., ["postgres", "redis", "node"])'),
      version: z.string().optional().describe('docker-compose version (default: 3.8)'),
    },
  },
  async ({ services, version }) => {
    const result = await handleGenerateCompose({ services, version });
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

// Tool 2: validate-compose
server.registerTool(
  'validate-compose',
  {
    title: 'Validate Docker Compose',
    description: 'Validate a docker-compose.yml file. Returns semantic errors and warnings.',
    inputSchema: {
      yaml: z.string().describe('docker-compose.yml content'),
    },
  },
  async ({ yaml }) => {
    const result = await handleValidateCompose({ yaml });
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

// Tool 3: parse-compose
server.registerTool(
  'parse-compose',
  {
    title: 'Parse Docker Compose',
    description:
      'Parse a docker-compose.yml into structured data. Returns services, networks, volumes, and dependencies.',
    inputSchema: {
      yaml: z.string().describe('docker-compose.yml content'),
    },
  },
  async ({ yaml }) => {
    const result = await handleParseCompose({ yaml });
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

// Tool 4: get-recommendations
server.registerTool(
  'get-recommendations',
  {
    title: 'Get Service Recommendations',
    description:
      'Get recommended companion services for a given service. E.g., "postgres" recommends pgadmin, redis, node.',
    inputSchema: {
      service: z.string().describe('Service name (e.g., "postgres")'),
      existing: z.array(z.string()).optional().describe('Already-used services to exclude'),
    },
  },
  async ({ service, existing }) => {
    const result = await handleGetRecommendations({ service, existing });
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('docker-compose-mcp server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
