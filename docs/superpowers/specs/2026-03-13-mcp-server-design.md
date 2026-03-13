# Phase 7: MCP Server — Design Spec

> Headless docker-compose generation, validation ve analysis servisi. stdio transport, npm ile dagitilir.

---

## Ozet

Visual Docker Compose Builder'in pure function'larini MCP (Model Context Protocol) tool'lari olarak expose eden bagimsiz bir Node.js paketi. AI asistanlar (Claude, Cursor, VS Code vb.) bu MCP server'a baglanarak docker-compose.yml uretebilir, mevcut YAML'i analiz edebilir ve servis onerileri alabilir. Web UI'dan tamamen bagimsiz calisir.

---

## 1. MCP Tool Tanimlari

### 1.1 `generate-compose`

Servis listesinden docker-compose.yml uretir.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "services": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Servis adlari listesi (orn: ['postgres', 'redis', 'node'])"
    },
    "version": {
      "type": "string",
      "default": "3.8",
      "description": "docker-compose version"
    }
  },
  "required": ["services"]
}
```

**Output:** `{ yaml: string, validation: ValidationIssue[] }`

**Mantik:**
1. Her servis adi icin config cozumle:
   - `PRESET_DEFAULTS`'ta varsa (nginx, postgres, redis, node) → oradan al
   - `RECOMMENDATION_DEFAULTS`'ta varsa (pgadmin, mongo, rabbitmq vb.) → oradan al
   - Hicbirinde yoksa → `{ image: servisAdi, ports: [] }` fallback, preset: 'custom'
2. Servisler arasi edge'leri otomatik cikar:
   - Recommendation graph'ta A'nin recommends listesinde B varsa ve her ikisi de input listesinde → edge olustur (source=B, target=A semantigi: A depends_on B)
   - Ornek: `["node", "postgres", "redis"]` → node depends_on postgres, node depends_on redis
3. Edge varsa `default` network otomatik olustur, her iki node'u ekle
4. `buildYaml()` ile YAML uret
5. `validate()` ile kontrol et
6. Ikisini birlikte dondur

### 1.2 `validate-compose`

Mevcut bir docker-compose.yml'i analiz eder, hatalari/uyarilari raporlar.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "yaml": {
      "type": "string",
      "description": "docker-compose.yml icerigi"
    }
  },
  "required": ["yaml"]
}
```

**Output:** `{ valid: boolean, issues: ValidationIssue[], services: string[] }`

**Mantik:**
1. `parseYaml(yaml)` ile parse et
2. Parse basarisizsa → `{ valid: false, issues: parseErrors, services: [] }`
3. Parse basariliysa → `validate({ nodes, edges })` calistir
4. Sonucu dondur, `services` listesinde mevcut servis adlarini ekle

### 1.3 `parse-compose`

YAML'i yapisal bilgiye cevirir.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "yaml": {
      "type": "string",
      "description": "docker-compose.yml icerigi"
    }
  },
  "required": ["yaml"]
}
```

**Output:**
```json
{
  "success": true,
  "services": [
    {
      "name": "postgres",
      "image": "postgres:16-alpine",
      "ports": ["5432:5432"],
      "environment": { "POSTGRES_DB": "app" },
      "dependsOn": ["redis"],
      "networks": ["default"]
    }
  ],
  "networks": [{ "name": "default", "driver": "bridge" }],
  "volumes": [{ "name": "pgdata" }],
  "errors": []
}
```

**Mantik:**
1. `parseYaml(yaml)` cagir
2. ParseResult'i human-readable formata cevir (ServiceNode → basit obje)
3. Edge'lerden `dependsOn` listesi olustur

### 1.4 `get-recommendations`

Belirli bir servis icin iliskili servis onerileri dondurur.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "service": {
      "type": "string",
      "description": "Oneri istenen servis adi (orn: 'postgres')"
    },
    "existing": {
      "type": "array",
      "items": { "type": "string" },
      "default": [],
      "description": "Halihazirda kullanilan servisler (filtreleme icin)"
    }
  },
  "required": ["service"]
}
```

**Output:**
```json
{
  "recommendations": [
    { "name": "pgadmin", "image": "dpage/pgadmin4", "reason": "Database yonetim arayuzu" },
    { "name": "redis", "image": "redis:7-alpine", "reason": "Cache katmani" }
  ]
}
```

**Mantik:**
1. `service` adini recommendation graph'ta bul
2. `existing` listesindeki servisleri filtrele
3. Kalan onerileri dondur

---

## 2. Proje Yapisi

```
packages/
  mcp-server/
    package.json
    tsconfig.json
    src/
      index.ts                    # MCP server: stdio transport, tool registration
      tools/
        generate-compose.ts       # generate-compose tool handler
        validate-compose.ts       # validate-compose tool handler
        parse-compose.ts          # parse-compose tool handler
        get-recommendations.ts    # get-recommendations tool handler
    bin/
      mcp-server.js               # #!/usr/bin/env node entry point
    __tests__/
      generate-compose.test.ts
      validate-compose.test.ts
```

### 2.1 Root package.json Degisikligi

```json
{
  "workspaces": ["packages/*"]
}
```

### 2.2 MCP Server package.json

```json
{
  "name": "docker-compose-mcp",
  "version": "1.0.0",
  "type": "module",
  "description": "MCP server for docker-compose.yml generation and analysis",
  "bin": {
    "docker-compose-mcp": "./bin/mcp-server.js"
  },
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "test": "vitest run"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "yaml": "^2.0.0",
    "zod": "^3.25.0"
  }
}
```

### 2.3 Shared Code Stratejisi

MCP server, mevcut pure function'lari TypeScript path alias ile import eder. Build sirasinda `tsup` veya `esbuild` ile tek bir bundle'a derlenir — publish edilen pakette relative import sorunu olmaz.

**Gelistirme sirasinda (source):**
```typescript
// packages/mcp-server/src/tools/generate-compose.ts
import { buildYaml } from '@vdc/shared/yaml-builder';
import { validate } from '@vdc/shared/validator';
import { PRESET_DEFAULTS } from '@vdc/shared/types';
```

**tsconfig.json path alias:**
```json
{
  "compilerOptions": {
    "paths": {
      "@vdc/shared/*": ["../../src/lib/*", "../../src/store/*", "../../src/data/*"]
    }
  }
}
```

**Build pipeline:**
- `tsup` kullanilir (esbuild tabanli bundler)
- Tum shared import'lar build sirasinda bundle'a inline edilir
- Cikan `dist/index.js` tek dosya, harici dependency yok (yaml ve @modelcontextprotocol/sdk haric)
- npm publish'te sadece `dist/` ve `bin/` dahil edilir

**package.json scripts:**
```json
{
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "test": "vitest run"
  },
  "devDependencies": {
    "tsup": "^8.0.0"
  }
}
```

Bu yaklasimla:
- Gelistirmede: path alias ile temiz import
- Build'de: tsup tum shared kodu bundle'a alir
- Publish'te: tek dosya, bagimlilik sorunu yok

---

## 3. MCP Server Entry Point

`packages/mcp-server/src/index.ts`:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({
  name: 'docker-compose-mcp',
  version: '1.0.0',
});

// Register 4 tools with zod input schemas
server.registerTool('generate-compose', {
  title: 'Generate Docker Compose',
  description: '...',
  inputSchema: z.object({
    services: z.array(z.string()),
    version: z.string().optional(),
  }),
}, async ({ services, version }) => {
  // handler
});

// ... validate-compose, parse-compose, get-recommendations

const transport = new StdioServerTransport();
await server.connect(transport);
```

`packages/mcp-server/bin/mcp-server.js`:
```javascript
#!/usr/bin/env node
import '../dist/index.js';
```

---

## 4. Kullanici Kurulumu

Claude Desktop / Claude Code / Cursor config'e ekle:

```json
{
  "mcpServers": {
    "docker-compose": {
      "command": "npx",
      "args": ["docker-compose-mcp"]
    }
  }
}
```

Veya lokal gelistirme icin:
```json
{
  "mcpServers": {
    "docker-compose": {
      "command": "node",
      "args": ["packages/mcp-server/bin/mcp-server.js"]
    }
  }
}
```

---

## 5. Test Stratejisi

### Unit Testleri (Vitest)

**`generate-compose.test.ts`:**
- Bilinen servisler (postgres, redis) → gecerli YAML uretir
- Bilinmeyen servis (myapp) → custom image ile YAML uretir
- Bos services listesi → hata dondurur
- Edge auto-detection: node + postgres → depends_on olusur
- Validation issues birlikte doner

**`validate-compose.test.ts`:**
- Gecerli YAML → valid: true, issues bos
- Gecersiz YAML (parse hatasi) → valid: false, errors listesi
- Semantik hatalar (bos image) → issues listesinde error

### E2E Test
E2E test yok — headless MCP, browser testi gereksiz.
Manuel test: Claude Desktop/Claude Code config'e ekleyip gercek prompt'larla test edilir.

---

## 6. Dokunulmayan Alanlar

- Web uygulamasi kodu, Vite config, React bileşenleri — degisiklik yok
- Mevcut `src/lib/` pure function'lari degismez, sadece import edilir
- Mevcut test suite'i etkilenmez
- Sadece root `package.json`'a `workspaces` field'i eklenir

---

## 7. Gelecek Phase ile Iliski

- **Phase 8 (AI Generation):** MCP server'a AI-powered tool eklenebilir (kullanici API key ile LLM cagirip daha akilli compose uretimi)
