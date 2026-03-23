# MCP Documentation Page & App Routing

> Phase 11 — MCP wiki sayfasi, React Router entegrasyonu, canvas navigasyonu

---

## 1. Problem

- Canvas'a girdikten sonra landing page veya baska sayfalara donulemiyordu (tek yonlu gecis)
- MCP server (5 tool) var ama kullanici-facing dokumantasyonu yok
- Uygulama URL-based routing kullanmiyor — state-based view switching ile sinirli

## 2. Kararlar

| Karar | Secim | Alternatifler |
|---|---|---|
| Routing | React Router (URL-based) | Hash router, History API manual |
| Canvas navigasyon | Logo dropdown menu | Breadcrumb links, home icon + cmd-K |
| Landing MCP link | Navbar link + feature card | Sadece biri |
| MCP sayfa icerigi | Setup guide + API ref (progressive disclosure) | Sadece biri |
| Hedef kitle | Hem son kullanicilar hem gelistiriciler | Sadece biri |

## 3. Routing Mimarisi

### 3.1 Yeni Dependency

`react-router-dom` v7+ — PROJECT_SPEC.md Section 2'ye eklenmeli.

### 3.2 Rotalar

| Rota | Component | Aciklama |
|---|---|---|
| `/` | `LandingPage` | Ana landing — ilk ziyarette gosterilir |
| `/app` | `CanvasLayout` | Builder canvas (mevcut App canvas kismi) |
| `/mcp` | `McpDocsPage` | MCP wiki/dokumantasyon |

### 3.3 Ilk Ziyaret Mantigi (korunuyor)

- `/` adresine gelen kullanici landing gorur
- "Start Building" tiklaninca `navigate('/app', { replace: true })` + `sessionStorage('vdc-entered', '1')`
  - **`replace: true` zorunlu** — aksi halde browser Back butonu `/` → redirect → `/app` sonsuz dongusu olusturur
- Mevcut calismasi varsa (`vdc-store` icinde node'lar) → otomatik `/app`'e redirect (`replace: true`)
- `sessionStorage('vdc-entered')` set ise → otomatik `/app`'e redirect (`replace: true`)
- `/mcp` her zaman direkt erisilebilir (redirect yok)
- `/app` direkt erisimde bos canvas gosterilir (redirect yok, mevcut davranisla ayni)

## 4. Navigasyon Bilesenleri

### 4.1 Landing Page Navbar

- Mevcut navbar'a "MCP Docs" linki eklenir (GitHub butonunun soluna, ayni glass stil)
- Tiklaninca `navigate('/mcp')`

### 4.2 Landing Page Feature Cards

- Mevcut 9 feature card'dan biri MCP ile degistirilir (3x3 grid simetrisini korumak icin)
- Degistirilecek kart: "Validation" (Shield) — bu ozellik zaten YAML output panel'de gorunur, ayri bir card'a ihtiyac yok
- Yeni kart:
  - Icon: `Plug` (lucide-react)
  - Title: "MCP Integration"
  - Desc: "Connect your IDE to VCompose via Model Context Protocol"
  - Tiklaninca `/mcp`'ye yonlendirir (diger card'lardan farkli olarak tiklama davranisi var)

### 4.3 Canvas HeaderBar — Logo Dropdown

- VCompose logosu + "▼" indicator tiklanabilir olur
- Dropdown menu:
  - Home → `sessionStorage.removeItem('vdc-entered')` sonra `navigate('/')` — boylece `/` route redirect yapmaz, landing gosterir
  - MCP Docs → `navigate('/mcp')`
  - separator
  - Star on GitHub → external link
- Dropdown disina tiklaninca kapanir (click-outside pattern)

### 4.4 MCP Sayfasi Navbar

- Landing page navbar ile ayni yapi (logo + linkler)
- Ek olarak "Open Builder →" butonu (accent renk, `/app`'e yonlendirir)

### 4.5 Cmd-K Command Palette

- Mevcut actions listesine eklenir: "Go to Home", "Go to MCP Docs"
- "Go to Home" → `sessionStorage.removeItem('vdc-entered')` sonra `navigate('/')` (dropdown ile ayni mantik)
- "Go to MCP Docs" → `navigate('/mcp')`
- CommandSearch sadece `/app` route'unda render edilir (mevcut davranisla ayni)
- `/mcp` sayfasinda command palette yok — o sayfanin kendi navbar navigasyonu yeterli

## 5. MCP Wiki Sayfasi Icerik Yapisi

Sayfa tek uzun scroll — progressive disclosure ile section'lara ayrilir.

### 5.1 Hero Section

- Baslik: "MCP Integration"
- Alt baslik: "Connect your AI-powered IDE to VCompose and manage Docker Compose files with natural language"
- "Open Builder →" CTA butonu

### 5.2 Section 1: MCP Nedir?

- 3-4 cumle ile MCP kavrami aciklamasi (Model Context Protocol)
- "AI IDE'niz ile VCompose arasinda kopru" metaforu
- Desteklenen IDE listesi: Claude Code, Cursor, VS Code (Cline/Continue), Windsurf

### 5.3 Section 2: Kurulum (Setup Guide)

Her IDE icin ayri tab/accordion:

- **Claude Code:** `claude mcp add` komutu + `claude_desktop_config.json` ornegi
- **Cursor:** `.cursor/mcp.json` konfigurasyonu
- **VS Code:** extension ayarlari
- **Generic:** stdio transport ile manual setup

Her birinde copy-paste edilebilir config JSON bloklari.
Syntax highlighted code bloklari (mevcut `react-syntax-highlighter` ile).

### 5.4 Section 3: Araclar (5 Tool Referansi)

Her tool icin kart:

| Tool | Aciklama | Input |
|---|---|---|
| `generate-compose` | Servis listesinden YAML uret | `services: string[], version?: string` |
| `validate-compose` | YAML dogrula, hata/uyari dondur | `yaml: string` |
| `parse-compose` | YAML'i yapilandirilmis veriye cevir | `yaml: string` |
| `get-recommendations` | Servise uygun tamamlayici onerileri al | `service: string, existing?: string[]` |
| `ai-generate-compose` | Dogal dil ile AI destekli YAML uret | `prompt, provider, apiKey, model?, baseUrl?, mode?, yaml?` |

Her kartta: aciklama, input parametreleri tablosu, ornek kullanim (prompt → sonuc).

### 5.5 Section 4: Ornek Kullanim Senaryolari

- "Bana bir MERN stack olustur" → generate-compose ciktisi
- "Bu YAML'da hata var mi?" → validate-compose ciktisi
- "PostgreSQL icin ne onerirsin?" → get-recommendations ciktisi

### 5.6 Gorsel Stil

Landing page ile ayni dark theme, gold accent, glass morphism kartlar.
Ayni `#0a0806` arka plan, ayni tipografi.

## 6. Dosya Degisiklikleri

### 6.1 Yeni Dosyalar

| Dosya | Amac |
|---|---|
| `src/components/McpDocsPage.tsx` | MCP wiki sayfasi |
| `src/components/NavDropdown.tsx` | Logo dropdown menu (HeaderBar'da kullanilir) |

### 6.2 Degisen Dosyalar

| Dosya | Degisiklik |
|---|---|
| `src/App.tsx` | `showLanding` state kaldir → `<BrowserRouter>` + `<Routes>` |
| `src/components/HeaderBar.tsx` | Logo'yu NavDropdown ile sar |
| `src/components/LandingPage.tsx` | `onEnter` prop kaldirilir → `useNavigate()` ile `/app`'e yonlendirme, navbar'a MCP link + feature card ekle |
| `src/components/CommandSearch.tsx` | Actions'a "Go to Home" + "Go to MCP Docs" ekle |
| `package.json` | `react-router-dom` dependency ekle |
| `PROJECT_SPEC.md` | Section 2'ye react-router-dom ekle, Section 8'e Phase 11 ekle |
| `docs/specs/persistence.md` | sessionStorage redirect mantigi guncelle (artik route-level) |
| `docs/specs/e2e-tests.md` | Yeni E2E test senaryolari ekle (MCP nav, dropdown, routing) |
| `docs/STATUS.md` | Phase 11 ilerlemesini guncelle |

### 6.3 Degismeyen Dosyalar

- Store, lib, canvas, sidebar, panel, output — hicbiri etkilenmez
- MCP server (`packages/mcp-server/`) — degismez

## 7. State Yonetimi

- Routing tamamen React Router'a devredilir
- `sessionStorage('vdc-entered')` ve `localStorage('vdc-store')` kontrolleri `/` route'unda redirect logic olarak kalir
- Canvas state (Zustand) etkilenmez — `/app` route mount oldugunda store aynen calisir

## 8. Test Stratejisi

- Mevcut unit testler (99) etkilenmemeli
- MCP unit testler (14) etkilenmemeli
- **Tum 9 mevcut E2E test dosyasi guncellenmeli** — `page.goto('/')` + sessionStorage bypass yerine `page.goto('/app')` kullanilmali:
  - `e2e/flows/add-node.spec.ts`
  - `e2e/flows/configure-node.spec.ts`
  - `e2e/flows/marketplace.spec.ts`
  - `e2e/flows/network-management.spec.ts`
  - `e2e/flows/persistence.spec.ts`
  - `e2e/flows/recommendations.spec.ts`
  - `e2e/flows/stacks.spec.ts`
  - `e2e/flows/yaml-import.spec.ts`
  - `e2e/flows/yaml-output.spec.ts`
- Yeni E2E testler:
  - Landing → Canvas gecisi (URL degisimini test eder)
  - MCP sayfasina navigasyon
  - Logo dropdown menu ile geri donus

## 9. Deployment Notu

`BrowserRouter` kullanimi nedeniyle hosting ortami SPA fallback desteklemeli.
Mevcut `nginx.conf` zaten `try_files $uri $uri/ /index.html;` iceriyor — ek degisiklik gerekmez.
Vite dev server varsayilan olarak tum rotalari `index.html`'e yonlendirir — ek config gerekmez.
