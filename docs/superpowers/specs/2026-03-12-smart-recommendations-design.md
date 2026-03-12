# Phase 6: Smart Recommendations — Design Spec

> Servis secildiginde iliskili teknolojileri oneren, rule-based + Docker Hub hibrit sistemi.

---

## Ozet

Canvas'ta bir servis secildiginde, ConfigPanel altinda "Onerilen Servisler" bolumu gosterilir. Oneriler static bir iliski grafiginden gelir, image detaylari Docker Hub API'den (Phase 4 altyapisi) cekilir. Kullanici tek tikla onerilen servisi canvas'a ekleyebilir — node + edge + network otomatik olusturulur.

---

## 1. Veri Katmani

### 1.1 Iliski Grafi — `src/data/recommendation-graph.json`

```json
{
  "postgres": {
    "recommends": ["pgadmin", "redis", "node", "adminer"],
    "reasons": {
      "pgadmin": "Database yonetim arayuzu",
      "redis": "Cache katmani",
      "node": "Backend uygulama sunucusu",
      "adminer": "Hafif database yonetim araci"
    }
  },
  "nginx": {
    "recommends": ["node", "postgres", "certbot"],
    "reasons": {
      "node": "Reverse proxy arkasinda uygulama sunucusu",
      "postgres": "Veritabani katmani",
      "certbot": "SSL sertifika otomasyonu"
    }
  },
  "redis": {
    "recommends": ["node", "postgres", "redis-commander"],
    "reasons": {
      "node": "Cache kullanan uygulama sunucusu",
      "postgres": "Kalici veri katmani",
      "redis-commander": "Redis yonetim arayuzu"
    }
  },
  "node": {
    "recommends": ["postgres", "redis", "nginx", "mongo"],
    "reasons": {
      "postgres": "Iliskisel veritabani",
      "redis": "Cache ve session store",
      "nginx": "Reverse proxy / load balancer",
      "mongo": "NoSQL veritabani"
    }
  },
  "custom": {
    "recommends": [],
    "reasons": {}
  },
  "mongo": {
    "recommends": ["mongo-express", "node", "redis"],
    "reasons": {
      "mongo-express": "MongoDB yonetim arayuzu",
      "node": "Backend uygulama sunucusu",
      "redis": "Cache katmani"
    }
  },
  "rabbitmq": {
    "recommends": ["node", "postgres", "redis"],
    "reasons": {
      "node": "Message consumer uygulama",
      "postgres": "Kalici veri katmani",
      "redis": "Cache katmani"
    }
  },
  "elasticsearch": {
    "recommends": ["kibana", "logstash", "node"],
    "reasons": {
      "kibana": "Elasticsearch gorsellesstirme arayuzu",
      "logstash": "Log toplama ve issleme",
      "node": "Arama entegrasyonlu uygulama"
    }
  }
}
```

Baslangicta 8 kaynak servis, toplam ~15 benzersiz oneri. Topluluk PR'lariyla genisler.

### 1.2 Oneri Defaults — `src/data/recommendation-defaults.ts`

Mevcut `PRESET_DEFAULTS` disinda kalan onerilen image'lar icin default konfigurasyonlar:

```typescript
export const RECOMMENDATION_DEFAULTS: Record<string, RecommendationDefault> = {
  pgadmin: {
    image: 'dpage/pgadmin4',
    ports: [{ host: '5050', container: '80' }],
    environment: {
      PGADMIN_DEFAULT_EMAIL: 'admin@admin.com',
      PGADMIN_DEFAULT_PASSWORD: 'admin',
    },
  },
  adminer: {
    image: 'adminer',
    ports: [{ host: '8080', container: '8080' }],
  },
  certbot: {
    image: 'certbot/certbot',
    volumes: [
      { source: './certbot/conf', target: '/etc/letsencrypt' },
      { source: './certbot/www', target: '/var/www/certbot' },
    ],
  },
  mongo: {
    image: 'mongo:7',
    ports: [{ host: '27017', container: '27017' }],
    environment: {
      MONGO_INITDB_ROOT_USERNAME: 'root',
      MONGO_INITDB_ROOT_PASSWORD: 'password',
    },
  },
  'mongo-express': {
    image: 'mongo-express',
    ports: [{ host: '8081', container: '8081' }],
    environment: {
      ME_CONFIG_MONGODB_ADMINUSERNAME: 'root',
      ME_CONFIG_MONGODB_ADMINPASSWORD: 'password',
    },
  },
  'redis-commander': {
    image: 'rediscommander/redis-commander',
    ports: [{ host: '8081', container: '8081' }],
  },
  rabbitmq: {
    image: 'rabbitmq:3-management',
    ports: [
      { host: '5672', container: '5672' },
      { host: '15672', container: '15672' },
    ],
  },
  elasticsearch: {
    image: 'elasticsearch:8.12.0',
    ports: [{ host: '9200', container: '9200' }],
    environment: {
      'discovery.type': 'single-node',
      'xpack.security.enabled': 'false',
    },
  },
  kibana: {
    image: 'kibana:8.12.0',
    ports: [{ host: '5601', container: '5601' }],
  },
  logstash: {
    image: 'logstash:8.12.0',
    ports: [{ host: '5044', container: '5044' }],
  },
};
```

### 1.3 Type Tanimlari

```typescript
export interface RecommendationDefault {
  image: string;
  ports?: PortMapping[];
  volumes?: VolumeMapping[];
  environment?: Record<string, string>;
}

export interface Recommendation {
  key: string;           // graph'taki anahtar (orn: "pgadmin")
  image: string;         // RECOMMENDATION_DEFAULTS veya PRESET_DEFAULTS'tan
  reason: string;        // neden onerildigi
  alreadyExists: boolean; // canvas'ta zaten var mi
}
```

---

## 2. Recommendation Engine — `src/lib/recommendation-engine.ts`

Pure function, store'a bagimli degil:

```typescript
function getRecommendations(
  selectedNodeData: ServiceNodeData,
  existingServiceNames: string[],
  graph: RecommendationGraph
): Recommendation[]
```

**Mantik:**
1. Secili node'un `preset` veya `image` adina gore graph'ta eslesen kaydi bul
2. `recommends` listesinden `Recommendation[]` olustur
3. Canvas'ta zaten olan servisleri `alreadyExists: true` olarak isaretle
4. Sonuclari dondur (max 5 oneri)

**Eslestirme stratejisi:**
- Oncelik 1: `preset` key ile birebir eslesme (orn: preset="postgres")
- Oncelik 2: `image` adinin base kismini graph key'leriyle esle (orn: image="postgres:16-alpine" → "postgres")
- Eslesme yoksa: bos dizi don

---

## 3. Pozisyon Hesaplama — `src/lib/position-calculator.ts`

```typescript
function calculateRecommendedPosition(
  sourcePosition: { x: number; y: number },
  existingPositions: { x: number; y: number }[],
  index: number  // ayni kaynaktan kacinci oneri
): { x: number; y: number }
```

**Algoritma:**
- Base pozisyon: `sourceX + 250`, `sourceY + (index * 150)`
- Cakisma kontrolu: mevcut node'larla 200x100px bounding box overlap testi
- Overlap varsa: Y ekseninde +150px kaydir, tekrar kontrol et (max 10 iterasyon)

---

## 4. UI — `src/components/panel/RecommendationList.tsx`

- ConfigPanel'in altinda, secili node oldugunda gosterilir
- Baslik: "Onerilen Servisler"
- Her oneri satiri: image adi, reason (kucuk text), "+ Ekle" butonu
- `alreadyExists: true` olanlar disabled, "Zaten eklendi" etiketi
- Oneri yoksa component render edilmez
- Tailwind dark mode uyumlu

---

## 5. Store Action — `addRecommendedNode`

Tek action ile:
1. Yeni `ServiceNode` olustur (RECOMMENDATION_DEFAULTS veya PRESET_DEFAULTS'tan)
2. Canvas'a ekle (hesaplanan pozisyonda)
3. Edge olustur: yeni node → kaynak node (depends_on semantigi)
4. Her iki node'u `default` network'e ekle (mevcut edge logic ile ayni)

Bu action mevcut `addNode` + `addEdge` logic'ini yeniden kullanir, yeni bir store yazmaz.

---

## 6. Test Stratejisi

### Unit Testleri (Vitest)
- `recommendation-engine.test.ts`: graph okuma, filtreleme, eslestirme, bos graph, bilinmeyen image
- `position-calculator.test.ts`: base pozisyon, cakisma kaydirma, birden fazla oneri

### E2E Testleri (Playwright)
- Postgres ekle → ConfigPanel'de oneri listesi gorunur
- pgadmin onerisine tikla → canvas'ta iki node + edge gorunur
- Zaten eklenmis servis disabled gorunur

---

## 7. Dokunulmayan Alanlar

- Mevcut `PRESET_DEFAULTS`, store yapisi, `yaml-builder.ts`, `validator.ts` — degisiklik yok
- Phase 4 Docker Hub arama altyapisi oldugi gibi kullanilir
- Sidebar preset listesi degismez — oneriler sadece ConfigPanel'den erisilebilir

---

## 8. Gelecek Phase'lerle Iliski

- **Phase 7 (MCP Server):** `getRecommendations()` pure function oldugundan MCP tool olarak expose edilebilir
- **Phase 8 (AI Generation):** AI prompt'lari oneri graph'ini zenginlestirmek icin kullanilabilir
