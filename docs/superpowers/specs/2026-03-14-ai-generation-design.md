# Phase 8: AI-Powered Generation — Design Spec

> Vercel AI SDK ile 4 provider destekli, hybrid rule-based + LLM docker-compose generation.

---

## Ozet

Visual Docker Compose Builder'a AI-powered generation eklenir. Kullanicilar dogal dil prompt'u ile sifirdan docker-compose.yml uretebilir veya mevcut compose'u optimize edebilir. Vercel AI SDK (`ai` npm paketi) ile 4 LLM provider desteklenir. Kullanici kendi API key'ini saglayarak LLM cagrilari yapar. Ozellik hem Web UI (sidebar tab) hem MCP server (yeni tool) uzerinden kullanilabilir.

---

## 1. Desteklenen Provider'lar

| Provider | SDK Paketi | Default Model | Not |
|---|---|---|---|
| Anthropic | `@ai-sdk/anthropic` | `claude-sonnet-4-5` | Browser'da CORS sorunu olabilir, `dangerouslyAllowBrowser: true` |
| OpenAI | `@ai-sdk/openai` | `gpt-4.1` | Browser'dan calismasi beklenir |
| Gemini | `@ai-sdk/google` | `gemini-2.5-flash` | Browser'dan calismasi beklenir |
| GLM (z.ai) | `@ai-sdk/openai` | `glm-4-plus` | OpenAI-compatible endpoint, custom baseUrl zorunlu |

---

## 2. Type Tanimlari

```typescript
type AIProviderKey = 'anthropic' | 'openai' | 'gemini' | 'glm';

interface AIConfig {
  provider: AIProviderKey;
  apiKey: string;
  model: string;     // default: provider'a gore (bkz. Section 1 tablosu)
  baseUrl?: string;  // GLM icin zorunlu, digerleri opsiyonel
}

// Default config:
const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4.1',
};

// Provider basan default modeller:
const DEFAULT_MODELS: Record<AIProviderKey, string> = {
  anthropic: 'claude-sonnet-4-5',
  openai: 'gpt-4.1',
  gemini: 'gemini-2.5-flash',
  glm: 'glm-4-plus',
};

interface AIGenerateResult {
  success: boolean;
  yaml: string;
  error?: string;
}
```

---

## 3. AI Provider Layer

`src/lib/ai/` dizininde pure function'lar:

### 3.1 `ai-types.ts`
Type tanimlari (yukaridaki).

### 3.2 `ai-provider.ts`

**`createProvider(config: AIConfig)`**
Vercel AI SDK provider instance olusturur:
- `anthropic`: `createAnthropic({ apiKey, ... })`
- `openai`: `createOpenAI({ apiKey, ... })`
- `gemini`: `createGoogleGenerativeAI({ apiKey, ... })`
- `glm`: `createOpenAI({ apiKey, baseURL: config.baseUrl, ... })` (OpenAI-compatible)

CORS notu: Browser'da calisan provider'lar icin `dangerouslyAllowBrowser: true` ayari kullanilir. CORS hatasi alinirsa kullaniciya bilgi verilir.

**`generateCompose(prompt: string, config: AIConfig): Promise<AIGenerateResult>`**
1. `createProvider(config)` ile provider olustur
2. `generateText({ model, system, prompt })` cagir
3. Response'dan YAML blogu extract et (```yaml ... ``` arasindaki icerik)
4. YAML yoksa tum response'u YAML olarak kabul et
5. `{ success: true, yaml }` dondur
6. Hata durumunda `{ success: false, yaml: '', error: message }` dondur
7. CORS hatasi tespiti: `TypeError` + `fetch` iceren hata mesaji → "Bu provider browser'dan dogrudan calismayabilir. MCP server uzerinden deneyin." mesaji gosterilir
8. Timeout: `AbortController` ile 60 saniye timeout. Timeout asildiysa `{ success: false, error: 'Request timed out' }` dondur

**`optimizeCompose(yaml: string, prompt: string, config: AIConfig): Promise<AIGenerateResult>`**
1. Ayni flow, farkli prompt template kullanir
2. Mevcut YAML prompt'a eklenir

### 3.3 `prompt-templates.ts`

**Generate prompt:**
```
System: You are a Docker Compose expert. Generate valid docker-compose.yml files.
Rules:
- Use version "3.8"
- Use specific image tags (not :latest)
- Add appropriate environment variables
- Set up depends_on relationships
- Return ONLY the YAML inside a ```yaml code block, no explanations.

User: {user_prompt}
```

**Optimize prompt:**
```
System: You are a Docker Compose expert. Optimize docker-compose.yml files.
Rules:
- Apply Docker best practices
- Add healthchecks where appropriate
- Optimize resource usage
- Fix any issues
- Return ONLY the optimized YAML inside a ```yaml code block, no explanations.

User: Current docker-compose.yml:
{existing_yaml}

Optimization request: {user_prompt}
```

### 3.4 `yaml-extractor.ts`

Response'dan YAML blogu cikarir:
1. ` ```yaml\n...\n``` ` pattern'i ara
2. Bulursa icerigini dondur
3. Bulamazsa ` ```\n...\n``` ` pattern'i ara
4. O da yoksa tum response'u dondur

---

## 4. Store Layer

### 4.1 Ayri `src/store/ai-store.ts`

Ana store'dan bagimsiz Zustand store. Neden ayri:
- Undo/redo temporal middleware'ini kirletmesin
- `partialize` karisikligi olmasin
- AI config bagimsiz lifecycle

```typescript
interface AIStore {
  config: AIConfig;
  isLoading: boolean;
  error: string | null;
  setProvider: (provider: AIProviderKey) => void;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setBaseUrl: (url: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}
```

`persist` middleware ile localStorage'da saklanir (key: `vdc-ai-config`).
`partialize`: sadece `config` persist edilir, `isLoading` ve `error` transient.

Guvenlik notu: API key localStorage'da plain text saklanir. Bu client-side-only bir uygulama icin kabul edilen bir trade-off'tur — backend yok, key baska bir yere gonderilemez. XSS riski mevcut web uygulamalarindaki standart localStorage kullanimiyla aynidir.

---

## 5. Web UI

### 5.1 Sidebar Tab

Sol sidebar'da mevcut NodePalette'in yanina "AI" sekmesi eklenir. Tab degistirme mekanizmasi:
- Ust kisimda 2 tab: "Services" (mevcut palette) | "AI"
- AI sekmesi secildiginde:

**Icerik (yukaridan asagiya):**
1. **Provider dropdown** — 4 secenek: Anthropic, OpenAI, Gemini, GLM
2. **API Key input** — `type="password"`, goster/gizle toggle butonu
3. **Model dropdown** — Provider'a gore default modeller + "Custom" secenegi
4. **Base URL input** — Sadece GLM secildiginde veya custom model secildiginde gorunur
5. **Prompt textarea** — Placeholder: "Describe your docker-compose setup..."
6. **Iki buton yan yana:**
   - "Generate" — Sifirdan YAML uretir
   - "Optimize" — Mevcut canvas'i optimize eder (canvas bossa disabled)
7. **Loading spinner** — AI calisirken gorunur
8. **Error mesaji** — Kirmizi text, CORS hatasi icin ozel mesaj

### 5.2 Akis

**Pre-flight validation:**
- API key bossa → "Please enter an API key" hatasi, LLM cagrisi yapilmaz
- Prompt bossa → "Please enter a prompt" hatasi
- Optimize modunda canvas bossa (nodes.length === 0) → buton disabled

**Generate:**
1. Kullanici prompt yazar, "Generate" tiklar
2. `setLoading(true)`, `setError(null)`
3. `generateCompose(prompt, config)` cagrilir
4. Basarili → `parseYaml(result.yaml)` kontrol edilir
   - `parseResult.success === true` → `importCompose(parseResult)` → Canvas guncellenir
   - `parseResult.success === false` → `setError('AI returned invalid YAML: ' + parseResult.errors[0])`
5. Basarisiz → `setError(result.error)`
6. `setLoading(false)`

Not: `importCompose` mevcut canvas'i siler. Undo/redo (Phase 5) ile geri alinabilir.

**Optimize:**
1. Mevcut canvas → `buildYaml({ nodes, edges, networks, namedVolumes })` ile YAML'e cevrilir
2. `optimizeCompose(currentYaml, prompt, config)` cagrilir
3. Basarili → `parseYaml()` kontrol edilir → basarili ise `importCompose()`, degilse hata
4. Basarisiz → hata gosterilir

---

## 6. MCP Server Tool

### 6.1 `ai-generate-compose`

Yeni MCP tool: `packages/mcp-server/src/tools/ai-generate-compose.ts`

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "prompt": { "type": "string", "description": "Dogal dil aciklamasi" },
    "provider": { "type": "string", "enum": ["anthropic", "openai", "gemini", "glm"] },
    "apiKey": { "type": "string", "description": "LLM API key" },
    "model": { "type": "string", "description": "Model adi (opsiyonel)" },
    "baseUrl": { "type": "string", "description": "Custom base URL (GLM icin)" },
    "mode": { "type": "string", "enum": ["generate", "optimize"], "default": "generate" },
    "yaml": { "type": "string", "description": "Optimize modunda mevcut YAML" }
  },
  "required": ["prompt", "provider", "apiKey"]
}
```

**Output:** `{ yaml: string, validation: ValidationIssue[] }`

**Mantik:**
1. `mode === 'generate'` → `generateCompose(prompt, config)`
2. `mode === 'optimize'` → `optimizeCompose(yaml, prompt, config)`
3. `success === false` → MCP error response dondur: `{ content: [{ type: 'text', text: error }], isError: true }`
4. `success === true` → uretilen YAML'i `validate()` ile kontrol et
5. `{ yaml, validation }` dondur

### 6.2 Shared Code

`ai-provider.ts`, `prompt-templates.ts`, `yaml-extractor.ts` dosyalari `src/lib/ai/` altinda yasayacak. MCP server bunlari relative import ile kullanacak (`../../../../src/lib/ai/...`), tsup build'de bundle'a alinacak.

---

## 7. Proje Yapisi (Yeni/Degisen Dosyalar)

```
src/
  lib/
    ai/
      ai-types.ts              # Type tanimlari
      ai-provider.ts           # Provider factory + generateCompose + optimizeCompose
      prompt-templates.ts      # System/user prompt sablonlari
      yaml-extractor.ts        # Response'dan YAML extraction
    __tests__/
      ai-provider.test.ts      # Mock LLM ile unit testler
      yaml-extractor.test.ts   # YAML extraction testleri
  store/
    ai-store.ts                # Ayri Zustand store, persist middleware
  components/
    sidebar/
      AISidebar.tsx            # AI tab icerik componenti
      SidebarTabs.tsx          # Tab degistirme (Services | AI)
packages/
  mcp-server/
    src/tools/
      ai-generate-compose.ts   # MCP tool handler
    __tests__/
      ai-generate-compose.test.ts
```

---

## 8. Yeni Dependency'ler

```json
{
  "dependencies": {
    "ai": "^4.0.0",
    "@ai-sdk/anthropic": "^1.0.0",
    "@ai-sdk/openai": "^1.0.0",
    "@ai-sdk/google": "^1.0.0"
  }
}
```

GLM icin ayri paket yok — `@ai-sdk/openai` custom baseURL ile kullanilir.

---

## 9. Test Stratejisi

### Unit Testleri (Vitest)

**`yaml-extractor.test.ts`:**
- ` ```yaml ` blogu olan response → icerik cikarilir
- ` ``` ` blogu olan response → icerik cikarilir
- Code block olmayan response → tum text doner
- Bos response → bos string

**`ai-provider.test.ts`:**
- `generateCompose` basarili cagrida YAML doner (mock `generateText`)
- `optimizeCompose` mevcut YAML'i prompt'a ekler
- API hatasi → `{ success: false, error }` doner
- Gecersiz provider → hata firlatir
- CORS hatasi ozel mesajla yakalanir

**`ai-generate-compose.test.ts` (MCP):**
- Generate mode → `generateCompose` cagrilir
- Optimize mode → `optimizeCompose` cagrilir, `yaml` parametresi kullanilir
- Validation issues birlikte doner

### E2E Test
E2E test yok — AI cagrilari external API'ye bagimli, deterministic degil.

---

## 10. Dokumanasyon Guncellemeleri

- `docs/TYPES.md`: `AIProviderKey`, `AIConfig`, `AIGenerateResult`, `AIStore` tipleri eklenir
- `PROJECT_SPEC.md` Section 8: Phase 8 (AI-Powered Generation) eklenir
- `PROJECT_SPEC.md` Section 2: `ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google` dependency'leri eklenir
- `docs/STATUS.md`: Phase 8 satiri eklenir

---

## 11. Sidebar Entegrasyon Detayi

Mevcut sidebar yapisi `App.tsx`'te render edilir. Degisiklik:
- `SidebarTabs.tsx` wrapper component olusturulur
- `App.tsx`'te mevcut `<NodePalette />` yerine `<SidebarTabs />` kullanilir
- `SidebarTabs` icinde tab state'e gore `<NodePalette />` veya `<AISidebar />` render edilir
- `NodePalette.tsx` dosyasi degismez, sadece parent degisir

---

## 12. Dokunulmayan Alanlar

- Mevcut `src/store/index.ts` degismez (ai-store ayri)
- Mevcut `src/lib/` pure function'lari degismez
- Mevcut test suite'i etkilenmez
- Mevcut sidebar NodePalette.tsx yapisi korunur, SidebarTabs.tsx wrapper eklenir
