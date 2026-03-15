# Enhanced Sidebar: Stacks + Docker Hub Marketplace

> **Phase 9** — Sidebar'ı 3 tab'lı profesyonel bir yapıya dönüştürme.
> Stacks (combined presets), Marketplace (Docker Hub live search), AI (mevcut).

---

## 1. Overview

Mevcut 5 sabit preset (nginx, postgres, redis, node, custom) yerine:

1. **Stacks Tab** — 16 hazır combined stack (Smart Home, Media, Monitoring vb.), tek tıkla tüm servisleri canvas'a ekler
2. **Marketplace Tab** — Docker Hub live search + 100-150 önceden tanımlı servis, kategori filtreleme
3. **AI Tab** — Mevcut AI generation (değişmez)

Mimari yaklaşım: **Modular Registry** — servisler bir kez tanımlanır, stack'ler servislere referans verir.

---

## 2. Data Architecture

### 2.1 Service Registry (`src/data/service-registry.ts`)

Her servis bir kez tanımlanır, benzersiz key ile. ~100-150 servis tanımı.

```typescript
export interface ServiceDefinition {
  key: string;              // 'redis', 'postgres', 'home-assistant'
  name: string;             // 'Redis'
  description: string;      // 'In-memory cache & message broker'
  image: string;            // 'redis:7-alpine'
  preset: PresetImageKey;   // 5 preset key'den biri veya 'custom' (fallback)
  category: ServiceCategory;
  ports: PortMapping[];
  volumes?: VolumeMapping[];
  environment?: Record<string, string>;
  healthcheck?: HealthcheckConfig;
  dockerHubSlug?: string;   // 'library/redis' — Hub API'den pull count vb. için
}

export type ServiceCategory =
  | 'database' | 'cache' | 'web-server' | 'runtime'
  | 'monitoring' | 'logging' | 'messaging' | 'storage'
  | 'security' | 'media' | 'iot' | 'ai' | 'devops'
  | 'productivity' | 'other';
```

**Preset Mapping:** Her `ServiceDefinition` bir `preset` alanı taşır. 5 orijinal preset
(`nginx`, `postgres`, `redis`, `node`, `custom`) kendi key'lerine eşlenir. Diğer tüm servisler
`preset: 'custom'` değerini alır. Bu, `ServiceNodeData.preset` gereksinimini karşılar ve
mevcut YAML builder / validator uyumluluğunu korur.

**Tüm data-layer type'ları `src/data/types.ts`'de tanımlanır** — `ServiceDefinition`, `ServiceCategory`,
`StackDefinition`, `StackServiceRef`, `StackEdgeRef`, `DockerHubSearchResult`, `CategoryDef`.
`src/lib/` ve `src/store/` bu type'ları `src/data/types.ts`'den import eder.
`src/data/` dizini PROJECT_SPEC.md Section 3.3'e eklenir.

Mevcut `PRESET_DEFAULTS` ve `RECOMMENDATION_DEFAULTS` bu registry'ye migrate edilir.

### 2.2 Stack Catalog (`src/data/stack-catalog.ts`)

Stack'ler servislere referans verir + layout ve dependency bilgisi ekler. 16 stack tanımı.

```typescript
export interface StackDefinition {
  key: string;              // 'smart-home'
  name: string;             // 'Smart Home'
  icon: string;             // emoji
  description: string;
  tags: string[];           // ['iot', 'automation', 'home']
  services: StackServiceRef[];
  edges: StackEdgeRef[];    // depends_on ilişkileri
}

export interface StackServiceRef {
  serviceKey: string;       // service-registry'den key
  overrides?: Partial<Pick<ServiceDefinition, 'ports' | 'volumes' | 'environment' | 'healthcheck' | 'image'>>;
  // Not: image override preset atamasını etkilemez — preset her zaman ServiceDefinition.preset'ten okunur
  gridPosition: { col: number; row: number }; // layout engine için
}

export interface StackEdgeRef {
  source: string;  // serviceKey — bağımlılık (depended upon, örn. postgres)
  target: string;  // serviceKey — bağımlı servis (dependent, örn. api)
  // Aynı DependencyEdge semantiği: target, source'a depends_on ile bağlanır.
  // Örnek: { source: 'postgres', target: 'node' } → node.depends_on: [postgres]
}
```

### 2.3 Categories (`src/data/categories.ts`)

Marketplace filtre chip'leri için:

```typescript
export interface CategoryDef {
  key: ServiceCategory;
  label: string;
  icon: string;
}
```

---

## 3. Stack Catalog (16 Stack)

| # | Key | Name | Services | Description |
|---|-----|------|----------|-------------|
| 1 | `smart-home` | Smart Home | home-assistant, mosquitto, zigbee2mqtt, node-red, influxdb, grafana | Akıllı ev otomasyonu |
| 2 | `iot-ming` | IoT / MING | mosquitto, influxdb, node-red, grafana, telegraf | Endüstriyel IoT pipeline |
| 3 | `media-arr` | Media Server | jellyfin, sonarr, radarr, prowlarr, lidarr, bazarr, qbittorrent | Medya yönetimi & streaming |
| 4 | `monitoring` | Monitoring | prometheus, grafana, alertmanager, cadvisor, node-exporter | Metrik toplama & alerting |
| 5 | `elk` | ELK Stack | elasticsearch, logstash, kibana | Merkezi log yönetimi |
| 6 | `loki` | Loki Stack | grafana, loki, promtail | Hafif log aggregation |
| 7 | `ai-llm` | AI / Local LLM | ollama, open-webui, qdrant, n8n | Lokal LLM & RAG |
| 8 | `lemp` | LEMP Stack | nginx, php-fpm, mysql, redis | PHP web geliştirme |
| 9 | `mern` | MERN Stack | mongodb, node, mongo-express, redis | JavaScript full-stack |
| 10 | `wordpress` | WordPress | wordpress, mysql, redis, phpmyadmin | CMS & blog |
| 11 | `nextcloud` | Nextcloud | nextcloud, postgres, redis, onlyoffice | Dosya sync & ofis |
| 12 | `gitops` | GitOps / DevTools | gitea, drone-ci, docker-registry, portainer | Git hosting & CI/CD |
| 13 | `security` | Security & Access | nginx-proxy-manager, authentik, wg-easy, adguard-home | Proxy, SSO, VPN, DNS |
| 14 | `photo-docs` | Photo & Docs | immich, postgres, redis, paperless-ngx | Fotoğraf & döküman yönetimi |
| 15 | `dashboard` | Homelab Dashboard | homepage, uptime-kuma, vaultwarden | Dashboard & uptime izleme |
| 16 | `coolify` | Coolify PaaS | coolify, postgres, redis, soketi, traefik | Self-hosted PaaS |

---

## 4. Docker Hub Proxy & Search

### 4.1 Cloudflare Worker

Ayrı deploy edilen minimal proxy. CORS header ekleyerek Docker Hub API'ye istek atar.

```
GET https://<worker>.workers.dev/search?q=redis&page=1&page_size=25
```

```typescript
// Cloudflare Worker
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const q = url.searchParams.get('q');

    if (!q) {
      return new Response(JSON.stringify({ error: 'Missing query parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const page = url.searchParams.get('page') || '1';
    const pageSize = url.searchParams.get('page_size') || '25';

    try {
      const hubUrl = `https://hub.docker.com/v2/search/repositories/?query=${q}&page=${page}&page_size=${pageSize}`;
      const response = await fetch(hubUrl);

      if (!response.ok) {
        return new Response(JSON.stringify({ error: 'Docker Hub API error' }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Proxy fetch failed' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  },
};
```

### 4.2 Client-side Search (`src/lib/dockerhub.ts` refactor)

Arama stratejisi:

1. **Önce local** — `service-registry.ts`'de query'ye uyan servisler filtrelenir (fuzzy match)
2. **Sonra remote** — Debounced (300ms) proxy üzerinden Docker Hub API çağrılır
3. **Merge** — Local tanımlı servisler üstte (zengin defaults), Hub sonuçları altta (temel bilgi)

```typescript
// DockerHubSearchResult → src/data/types.ts'de tanımlı (bkz. Section 2.1)
export interface DockerHubSearchResult {
  name: string;           // 'library/redis'
  slug: string;           // 'redis' (registryMatch varsa key, yoksa image adından türetilir)
  description: string;
  starCount: number;
  pullCount: number;
  isOfficial: boolean;
  registryMatch?: ServiceDefinition; // local'de varsa zengin defaults
}

export async function searchServices(
  query: string,
  registry: ServiceDefinition[]
): Promise<DockerHubSearchResult[]> {
  const localResults = filterRegistry(query, registry);
  const remoteResults = await searchDockerHub(query);
  return mergeAndDedupe(localResults, remoteResults);
}
```

### 4.3 Proxy URL Konfigürasyonu

```typescript
const PROXY_URL = import.meta.env.VITE_DOCKERHUB_PROXY_URL
  || 'https://vdc-hub-proxy.<account>.workers.dev';
```

Kullanıcı kendi proxy'sini deploy edip `.env`'den override edebilir.

### 4.4 Error Handling & Fallback

- **Proxy unreachable / timeout (5s):** Remote search sessizce başarısız olur, sadece local registry sonuçları gösterilir
- **Proxy non-200 response:** Aynı fallback — local sonuçlar
- **Boş query:** Remote çağrı yapılmaz, local registry'den popüler servisler gösterilir
- **Rate limiting:** Cloudflare Worker free tier 100k req/gün yeterli. Client-side 300ms debounce + sayfa başına 25 sonuç
- **UI göstergesi:** Marketplace tab'da remote search başarısız olursa küçük bir info banner: "Showing local results only — Docker Hub search unavailable"
- **Retry yok** — Kullanıcı yeni bir arama yaparsa tekrar dener

---

## 5. Sidebar UI Architecture

### 5.1 Tab Yapısı

Mevcut `SidebarTabs.tsx` 2 tab'dan 3 tab'a genişler:

```
┌─────────┬─────────────┬────────┐
│ Stacks  │ Marketplace │   AI   │
└─────────┴─────────────┴────────┘
```

### 5.2 Stacks Tab

- Stack kartları: icon, isim, servis sayısı, kısa açıklama, "Add" butonu
- Arama: stack name + description + tags üzerinden substring match (case-insensitive)
- Tek tıkla tüm servisler canvas'a eklenir (auto-position, auto-edges, auto-network)
- **NetworkPanel** Stacks tab'ın alt kısmında gösterilir (mevcut "Services" tab'daki yerini korur)
  - Divider ile ayrılır, Phase 3 Network Management UI korunur

### 5.3 Marketplace Tab

- Boşken: kategori chip'leri + local registry'deki popüler servisler
- Yazınca: 300ms debounce, local + Docker Hub sonuçları merge
- Local registry match'ler üstte (zengin bilgi), Hub-only sonuçlar altta (temel bilgi)
- Kategori chip'leri ile filtreleme
- **Loading state:** Arama sırasında skeleton/spinner gösterilir, remote başarısız olursa info banner

### 5.4 AI Tab

Mevcut `AISidebar.tsx` — değişiklik yok.

### 5.5 Yeni Component'ler

```
src/components/sidebar/
  SidebarTabs.tsx          # 3 tab (refactor)
  StacksPanel.tsx          # Stacks tab — stack arama + liste
  StackCard.tsx            # Tek stack kartı
  MarketplacePanel.tsx     # Marketplace tab — search + kategori + liste
  ServiceCard.tsx          # Tek servis kartı (Marketplace + Stack'te ortak)
  CategoryChips.tsx        # Filtreleme chip'leri
  AISidebar.tsx            # Mevcut (değişmez)
```

---

## 6. Stack Layout Engine & Canvas Integration

### 6.1 Layout Engine (`src/lib/stack-layout.ts`)

Stack canvas'a eklendiğinde servislerin otomatik pozisyonlanması:

```typescript
export interface LayoutConfig {
  startX: number;          // Drop pozisyonu veya canvas merkezi
  startY: number;
  nodeWidth: number;       // 180px
  nodeHeight: number;      // 80px
  gapX: number;            // 220px
  gapY: number;            // 150px
}

export interface LayoutResult {
  nodes: Array<{
    serviceKey: string;
    position: { x: number; y: number };
  }>;
}

export function calculateStackLayout(
  stack: StackDefinition,
  config: LayoutConfig
): LayoutResult
```

Stack tanımındaki `gridPosition: { col, row }` bilgisi pixel pozisyonuna çevrilir.

### 6.2 Store Actions

`AppStore`'a eklenen yeni action'lar:

```typescript
// Stack ekleme — tüm servisleri, edge'leri, network'ü batch olarak ekler
addStack: (stackKey: string, dropPosition: { x: number; y: number }) => void;

// Registry'den tekil servis ekleme (zengin defaults)
addServiceFromRegistry: (serviceKey: string, position: { x: number; y: number }) => void;

// Docker Hub'dan tekil servis ekleme (temel + varsa registry match)
addServiceFromHub: (hubResult: DockerHubSearchResult, position: { x: number; y: number }) => void;
```

**`addServiceFromHub` detayı (Hub-only, registryMatch yok):**
- `preset: 'custom'`
- `image: hubResult.name` (örn. `library/redis` → `redis`)
- `serviceName: ${slug}-${id.slice(0, 4)}`
- Boş `ports`, `volumes`, `environment` — kullanıcı ConfigPanel'den doldurur
- `registryMatch` varsa: registry'deki zengin defaults uygulanır (ports, env, healthcheck vb.)

**`DockerHubSearchResult.slug` fallback:** `dockerHubSlug` tanımlı ise kullanılır,
yoksa `key` değeri slug olarak kullanılır.

Bu 3 action `docs/TYPES.md` AppStore bölümüne ve `src/store/types.ts`'e eklenir:

```typescript
// AppStore'a eklenecek action'lar
addStack: (stackKey: string, dropPosition: { x: number; y: number }) => void;
addServiceFromRegistry: (serviceKey: string, position: { x: number; y: number }) => void;
addServiceFromHub: (hubResult: DockerHubSearchResult, position: { x: number; y: number }) => void;
```

`addStack` akışı:
1. `stack-catalog.ts`'den stack tanımını al
2. Her `StackServiceRef` için `service-registry.ts`'den `ServiceDefinition` al
3. `calculateStackLayout()` ile pozisyonları hesapla
4. Her servis için `ServiceNode` oluştur (override'lar uygulanır)
   - `serviceName`: `${serviceKey}-${id.slice(0, 4)}` formatında (mevcut `addNode` ile aynı)
   - Bu, mevcut canvas'ta aynı isimde servis olsa bile çakışmayı önler
   - `preset`: `ServiceDefinition.preset` alanından okunur
5. `StackEdgeRef`'lerden `DependencyEdge`'ler oluştur
6. Tüm servisleri `default` network'e ekle (yoksa oluştur)
7. Named volume'ları `namedVolumes`'a ekle
8. Hepsini tek `set()` çağrısı ile store'a yaz (tek undo adımı)
   - `temporal.pause()` / `resume()` kullanılmaz
   - Tüm state delta'sı (nodes, edges, networks, namedVolumes) tek closure'da hesaplanıp
     tek `set(state => ({ ...newState }))` ile yazılır
   - Bu sayede zundo tek bir undo step olarak kaydeder

### 6.3 Drag & Drop

```typescript
// Stacks:
e.dataTransfer.setData('application/vdc-stack', stackKey);

// Marketplace (registry):
e.dataTransfer.setData('application/vdc-service', serviceKey);

// Marketplace (Hub-only — sadece slug taşınır, drop'ta resolve edilir):
e.dataTransfer.setData('application/vdc-hub-image', JSON.stringify({ slug: hubResult.slug, image: hubResult.name }));
```

`FlowCanvas.tsx` `onDrop` handler'ı 4 MIME type'ı handle eder:
- Mevcut `application/vdc-preset` (backward compat)
- Yeni `application/vdc-stack`
- Yeni `application/vdc-service`
- Yeni `application/vdc-hub-image`

---

## 7. Migration & Backward Compatibility

### 7.1 Preset Sistemi

`PresetImageKey` type'ı korunur. `PRESET_DEFAULTS` service-registry'ye migrate edilir. `addNode(preset, position)` mevcut davranışını korur — internal olarak registry'den okur.

```typescript
export function getPresetFromRegistry(
  preset: PresetImageKey
): ServiceDefinition | undefined {
  return SERVICE_REGISTRY.find(s => s.key === preset);
}
```

### 7.2 localStorage Uyumluluğu

Persisted store yapısı değişmez — `ServiceNode`, `DependencyEdge` vb. aynı kalır. Yeni özellikler sadece ekleme mekanizmasını değiştirir.

### 7.3 Kaldırılacaklar

- `src/components/sidebar/NodePalette.tsx` → Stacks + Marketplace ile replace
- `src/data/recommendation-defaults.ts` → service-registry'ye merge
- `src/lib/dockerhub.ts` → refactor (40 hardcoded imaj → registry + proxy)
- Mevcut `DockerHubResult` interface'i → `DockerHubSearchResult` ile replace
- `src/components/panel/ImageSearchInput.tsx` ve `src/hooks/useDockerHubSearch.ts` → yeni API'ye güncelle

### 7.4 Recommendation System (Phase 6)

Recommendation sistemi korunur, service-registry'yi kullanacak şekilde refactor edilir:
- `recommendation-graph.json` korunur (service key'leri zaten uyumlu)
- `recommendation-engine.ts` korunur — `RECOMMENDATION_DEFAULTS` yerine service-registry'den okur
- `addRecommendedNode` store action'ı korunur — internal olarak registry'den okur
- `RecommendationList.tsx` korunur — ConfigPanel'de seçili node için öneriler göstermeye devam eder

### 7.5 localStorage Persist Versiyonu

Persist store `version: 1` olarak kalır. Yeni action'lar (fonksiyonlar) persist edilmez,
sadece state shape'i persist edilir. State shape değişmediği için migration gerekmez.

### 7.6 Type Güncellemeleri

Yeni data-layer type'ları `src/data/types.ts` dosyasında tanımlanır (store type'larından ayrı):
- `ServiceDefinition`, `ServiceCategory`
- `StackDefinition`, `StackServiceRef`, `StackEdgeRef`
- `DockerHubSearchResult`
- `CategoryDef`

`docs/TYPES.md` bu type'ları yeni bir "Data Layer Types" bölümünde belgeler.

`src/store/types.ts`'e sadece `AppStore` action'ları eklenir:
- `addStack`, `addServiceFromRegistry`, `addServiceFromHub`

---

## 8. File Map

| Path | Purpose |
|------|---------|
| `src/data/types.ts` | Data-layer type'lar (ServiceDefinition, StackDefinition vb.) |
| `src/data/service-registry.ts` | ~100-150 servis tanımı |
| `src/data/stack-catalog.ts` | 16 stack tanımı |
| `src/data/categories.ts` | Marketplace kategori tanımları |
| `src/lib/stack-layout.ts` | Stack layout engine (pure function) |
| `src/lib/dockerhub.ts` | Refactored — registry + proxy search |
| `src/components/sidebar/SidebarTabs.tsx` | 3 tab (refactor) |
| `src/components/sidebar/StacksPanel.tsx` | Stacks tab UI + NetworkPanel |
| `src/components/sidebar/StackCard.tsx` | Stack kartı |
| `src/components/sidebar/MarketplacePanel.tsx` | Marketplace tab UI |
| `src/components/sidebar/ServiceCard.tsx` | Servis kartı |
| `src/components/sidebar/CategoryChips.tsx` | Kategori filtreleme |
| `src/components/canvas/FlowCanvas.tsx` | Drop handler genişletme |
| `src/store/index.ts` | Yeni store actions |
| `src/store/types.ts` | AppStore action type'ları |
| `worker/` | Cloudflare Worker (Docker Hub proxy) |

---

## 9. Testing Strategy

### Unit Tests (Vitest)

- `service-registry.ts` — tüm tanımların geçerli olduğu (image, ports vb.)
- `stack-catalog.ts` — tüm stack'lerin geçerli servis key'lerine referans verdiği
- `stack-layout.ts` — layout hesaplamaları
- `dockerhub.ts` — local filter, merge, dedupe logic
- Store actions — `addStack`, `addServiceFromRegistry`, `addServiceFromHub`

### E2E Tests (Playwright)

- Stacks tab: stack arama, stack ekleme, canvas'ta doğru servis/edge sayısı
- Marketplace tab: arama, kategori filtre, servis ekleme
- Drag & drop: stack ve servis sürükleme

---

## 10. Non-Goals

- Kullanıcı tarafından custom stack oluşturma (gelecekte eklenebilir)
- Community stack import/export
- Docker Hub image tag listesi çekme (sadece search)

## 11. PROJECT_SPEC.md Güncellemeleri

Phase 9 aşağıdaki satır ile Section 8 (Post-MVP) tablosuna eklenir:

```
| 6 | Phase 9 | Enhanced Sidebar (Stacks + Marketplace) | `docs/superpowers/specs/2026-03-15-enhanced-sidebar-design.md` |
```

Section 3.3 dosya yapısına `src/data/` dizini eklenir:

```
src/
  data/           # Static data: service registry, stack catalog, categories
```

## 12. Araştırma Kaynakları

- [Docker Awesome Compose](https://github.com/docker/awesome-compose) — 290+ örnek
- [Haxxnet/Compose-Examples](https://github.com/Haxxnet/Compose-Examples) — 30+ kategori
- [2026 Homelab Stack](https://blog.elest.io/the-2026-homelab-stack-what-self-hosters-are-actually-running-this-year/) — Güncel trendler
- [Arr Stack Guide 2026](https://corelab.tech/arr-stack-docker-compose-guide/) — Media stack referans
- [MING Stack](https://blog.balena.io/ming-stack-mqtt-influxdb-nodered-grafana-balena/) — IoT referans mimarisi
- [Coolify Docs](https://coolify.io/docs/knowledge-base/docker/compose) — PaaS stack referans
- [Docker GenAI Stack](https://github.com/docker/genai-stack) — AI/LLM referans
