# Visual Docker Compose Builder — Project Specification

> **Claude Code için birincil giriş noktası.**
> Her oturumda önce bu dosyayı, sonra `docs/STATUS.md`'yi oku.
> Sonra göreve uygun spec dosyasına git. Kod yazmadan önce ilgili spec okunmalıdır.

---

## Dosya Haritası

| Dosya | İçerik |
|---|---|
| `PROJECT_SPEC.md` | Bu dosya — genel mimari, kurallar, stack |
| `docs/TYPES.md` | Tüm TypeScript interface'leri (canonical) |
| `docs/STATUS.md` | Canlı ilerleme takibi — her oturum sonu güncelle |
| `docs/specs/config-panel.md` | Configuration panel field kuralları |
| `docs/specs/yaml-builder.md` | YAML generation mantığı ve edge case'ler |
| `docs/specs/validator.md` | Validation kuralları ve ValidationIssue formatı |
| `docs/specs/edge-logic.md` | Edge çizme, depends_on, network otomasyonu |
| `docs/specs/persistence.md` | localStorage persistence mantığı |
| `docs/specs/e2e-tests.md` | Playwright E2E test senaryoları |
| `docs/specs/yaml-import.md` | *(Phase 2)* Import/parse logic |
| `docs/specs/network-management.md` | *(Phase 3)* Network UI ve driver yönetimi |

---

## 1. Project Overview

Fully client-side, browser-based visual builder for `docker-compose.yml` files. Kullanıcılar servisleri sürükle-bırak ile canvas'a ekler, yapılandırır, bağlantılarla `depends_on` tanımlar ve gerçek zamanlı YAML çıktısı alır. Backend yoktur.

---

## 2. Technology Stack

| Layer | Seçim | Not |
|---|---|---|
| Framework | React (Vite) | TypeScript strict mode |
| Styling | Tailwind CSS | Dark mode default |
| UI Components | 21st.dev Magic MCP | Önce fetch et, sıfırdan yapma |
| Canvas | React Flow v11+ | Custom node ve edge'ler |
| State | Zustand | Tek store, Context API yok |
| YAML | `yaml` npm paketi | Generation + import için |
| Test | Vitest | Sadece `lib/` logic'i test edilir |
| E2E Test | Playwright | Sadece critical happy path'ler |
| Lint | ESLint + @typescript-eslint | eslint-plugin-react-hooks dahil |
| Format | Prettier | Tailwind plugin dahil |
| Deploy | Docker multi-stage + Nginx | Coolify-ready |
| AI SDK | Vercel AI SDK (`ai`) | 4 provider: Anthropic, OpenAI, Gemini, GLM |
| Animation | Framer Motion | Spring physics, layoutId, AnimatePresence |
| Icons | lucide-react | SVG icon set for UI chrome |
| Command Palette | cmdk | ⌘K search for services/stacks/actions |
| Syntax Highlight | react-syntax-highlighter | PrismLight for YAML output |
| Draggable Panel | @ark-ui/react | Dialog primitive for floating config panel |

---

## 3. Claude Code — Çalışma Kuralları

### 3.1 Her Oturum Başında
1. `PROJECT_SPEC.md` oku (bu dosya)
2. `docs/STATUS.md` oku — neyin bittiğini, neyin sürdüğünü anla
3. Göreve uygun `docs/specs/<feature>.md` dosyasını oku
4. Type'lara ihtiyaç varsa `docs/TYPES.md` oku

### 3.2 Her Oturum Sonunda
- `docs/STATUS.md`'yi güncelle
- O oturumda alınan mimari kararları ilgili spec dosyasına yaz
- Dokümansız karar bırakma

### 3.3 Dosya & Klasör Disiplini

```
src/
  data/           # Static data: service registry, stack catalog, categories
  components/
    canvas/       # React Flow canvas, custom node/edge bileşenleri
    sidebar/      # Node palette
    panel/        # Configuration panel
    output/       # YAML output panel
  store/
    index.ts      # Zustand store
    types.ts      # Tüm TS interface'leri (docs/TYPES.md ile senkron)
  lib/
    yaml-builder.ts   # Pure function — YAML üretimi
    yaml-parser.ts    # Pure function — YAML import (Phase 2)
    validator.ts      # Pure function — semantic validation
  hooks/          # Custom React hooks
docs/
  specs/          # Feature başına bir .md
  TYPES.md        # Canonical type tanımları
  STATUS.md       # İlerleme takibi
```

**Kurallar:**
- Bu yapı dışına çıkmadan önce spec güncelle.
- Business logic React component içine girmesin — `lib/` veya store.
- `store/types.ts` ve `docs/TYPES.md` her zaman senkron olmalı.
- Yeni UI component yapmadan önce 21st.dev Magic MCP'yi kontrol et.

### 3.4 Scope Disiplini

- Section 5'te (MVP) veya Section 8'de (Post-MVP) olmayan hiçbir şeyi implement etme.
- Görev beklenenden büyük görünüyorsa: dur, `docs/specs/` altına spec yaz, sonra kodla.
- Section 2 dışında dependency ekleme.
- Çalışan kodu refactor etme — sadece mevcut görevi engelliyorsa.

---

## 4. Spec-Driven Development

Her feature için sırayla:

1. **Define** → `docs/specs/<feature>.md` yaz veya güncelle
2. **Review** → Edge case ve interface kontratları tamam mı?
3. **Test** → `lib/` logic'i için Vitest testleri yaz; critical flow'lar için Playwright E2E
4. **Implement** → React/Zustand kodu
5. **Verify** → Testler geçiyor, UI spec'e uyuyor
6. **Update** → `docs/STATUS.md`'yi güncelle

---

## 5. MVP Features

### 5.1 Node Palette
Preset'ler: `nginx`, `postgres`, `redis`, `node`, `custom`.
Her blok canvas'a sürüklenebilir. Detay: `docs/specs/config-panel.md`.

### 5.2 Canvas
React Flow grid, snap-to-grid. Custom `ServiceNode` component. Delete: keyboard + context menu.

### 5.3 Configuration Panel
Seçili node için açılır. Alanlar: `service_name`, `image`, `ports`, `volumes`, `environment`, `healthcheck`.
Tam kural seti: `docs/specs/config-panel.md`.

### 5.4 Edge Logic
A → B ok çizmek: B'ye `depends_on: [A]` ekler, her ikisini `default` network'e koyar.
Detay: `docs/specs/edge-logic.md`.

### 5.5 YAML Output Panel
Real-time, read-only. Copy + Download butonları. Validation status göstergesi (✅ / ⚠️ / ❌).
Generation kuralları: `docs/specs/yaml-builder.md`.

### 5.6 Validation Layer
Pure `validator.ts` — her store değişikliğinde çalışır, `ValidationIssue[]` döner.
Kural listesi: `docs/specs/validator.md`.

### 5.7 localStorage Persistence
Zustand `persist` middleware ile store otomatik olarak `localStorage`'a kaydedilir ve sayfa yüklendiğinde geri yüklenir.
Detay: `docs/specs/persistence.md`.

---

## 6. Mimari Kurallar

- **No backend.** Hiçbir veri tarayıcı dışına çıkmaz.
- **Zustand tek kaynak.** YAML çıktısını etkileyen hiçbir şey local state'te tutulmaz.
- **YAML derived state.** `buildYaml(store) => string` — pure function, store içinden çağrılmaz.
- **Validation derived state.** `validate(store) => ValidationIssue[]` — root component'taki `useEffect` içinden çağrılır, sonuç store'a yazılır.
- **Named volumes:** `VolumeMapping.source` içinde `/` veya `.` içermeyen değerler otomatik olarak top-level `volumes:` bloğuna eklenir.
- **Networks:** `default` network ilk edge eklendiğinde otomatik oluşturulur.
- **Undo/Redo:** Zustand temporal middleware MVP scaffold'una eklenir (UI olmasa da). Sonradan eklenmesi store refactor gerektirir.

---

## 7. Type Tanımları

→ Tüm interface'ler için bkz. `docs/TYPES.md`

Ana tipler: `ServiceNode`, `DependencyEdge`, `NetworkConfig`, `NamedVolume`, `ValidationIssue`, `AppStore`.

---

## 8. Post-MVP Yol Haritası

| Öncelik | Phase | Özellik | Spec |
|---|---|---|---|
| 1 | Phase 2 | YAML Import | `docs/specs/yaml-import.md` |
| 2 | Phase 3 | Network Management UI | `docs/specs/network-management.md` |
| 3 | Phase 4 | Docker Hub Search | `docs/specs/dockerhub-search.md` |
| 4 | Phase 5 | Undo/Redo UI | `docs/specs/undo-redo.md` |
| 5 | Phase 8 | AI-Powered Generation | `docs/superpowers/specs/2026-03-14-ai-generation-design.md` |
| 6 | Phase 9 | Enhanced Sidebar (Stacks + Marketplace) | `docs/superpowers/specs/2026-03-15-enhanced-sidebar-design.md` |
| 7 | Phase 10 | UI Redesign | `docs/superpowers/specs/2026-03-16-ui-redesign-design.md` |

---

## 9. Non-Goals (Hiçbir Zaman)

- Multi-file / `extends` desteği
- Docker Swarm / Kubernetes çıktısı
- Real-time collaboration
- Mobile / touch desteği
- docker-compose v1 syntax (sadece v3.x+)
- Circular dependency detection (MVP'de yok)

---

## 10. Deployment

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

`nginx.conf`'ta `try_files $uri $uri/ /index.html;` zorunlu.
Coolify: Dockerfile modu, port 80. Environment variable gerekmez.

---

## 11. MCPs

| MCP | Kullanım |
|---|---|
| 21st.dev Magic MCP | Button, panel, input, modal, tab — önce buraya bak |
| Search/Fetch MCP | React Flow docs; Docker Hub (Phase 4) |
| Docker MCP | Opsiyonel — geliştirme sırasında YAML validasyonu |
