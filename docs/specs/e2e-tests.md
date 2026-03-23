# Spec: Playwright E2E Tests

> İlgili kod: `e2e/` klasörü
> Çalıştırma: `npx playwright test`
> CI: build sonrası çalışır

---

## Sorumluluk

Critical happy path'leri uçtan uca test et. Sadece MVP akışları — edge case'ler Vitest'te kalır.

---

## Klasör Yapısı

```
e2e/
  flows/
    add-node.spec.ts
    configure-node.spec.ts
    create-edge.spec.ts
    yaml-output.spec.ts
    persistence.spec.ts
    routing.spec.ts
```

---

## Test Senaryoları

### 1. add-node.spec.ts
- Sidebar'dan bir preset (nginx) sürükle, canvas'a bırak.
- Canvas'ta yeni node görünür.
- Node'un default değerleri doğru olmalı (image: `nginx:alpine`, port: `80:80`).

### 2. configure-node.spec.ts
- Node'a tıkla, config panel açılır.
- `service_name` değiştir, YAML çıktısında yansıdığını doğrula.
- Port ekle, YAML'da `ports:` bloğunda göründüğünü doğrula.

### 3. create-edge.spec.ts
- İki node ekle (postgres + node).
- Aralarına edge çiz.
- YAML'da `depends_on` oluştuğunu doğrula.
- YAML'da `networks:` bloğunun oluştuğunu doğrula.

### 4. yaml-output.spec.ts
- Bir node ekle ve yapılandır.
- Copy butonuna bas, clipboard'da YAML olduğunu doğrula.
- Download butonuna bas, dosya indirildiğini doğrula.

### 5. persistence.spec.ts
- Bir node ekle ve yapılandır.
- Sayfayı yenile (`page.reload()`).
- Node'un hala canvas'ta olduğunu doğrula.
- Yapılandırma değerlerinin korunduğunu doğrula.

### 6. routing.spec.ts — Routing & Navigation (7 test)

**6.1 First visit shows landing page**
- `localStorage` ve `sessionStorage` temizle.
- `/` adresine git.
- LandingPage görünür (`data-testid="landing-page"` veya başlık metni).

**6.2 Start Building navigates to /app**
- LandingPage'deki "Start Building" butonuna tıkla.
- URL `/app` olur.
- Canvas görünür.

**6.3 Returning visitor auto-redirects to /app**
- `sessionStorage.setItem('vdc-entered', '1')` ile dönüş ziyaretçisi simüle et.
- `/` adresine git.
- `LandingRedirect` otomatik olarak `/app`'e yönlendirir.
- Canvas görünür, LandingPage görünmez.

**6.4 /mcp shows MCP documentation**
- `/mcp` adresine git.
- MCP documentation page görünür (başlık veya araç listesi içeriği).

**6.5 MCP Docs link navigates to /mcp**
- `/` adresine git (LandingPage).
- "MCP Docs" bağlantısına tıkla.
- URL `/mcp` olur.

**6.6 Logo dropdown Home navigates to /**
- `/app`'e git (canvas görünür).
- HeaderBar logosuna tıkla (NavDropdown açılır).
- "Home" öğesine tıkla.
- URL `/` olur ve `sessionStorage` `vdc-entered` key'i temizlenir.

**6.7 Logo dropdown MCP Docs navigates to /mcp**
- `/app`'e git (canvas görünür).
- HeaderBar logosuna tıkla (NavDropdown açılır).
- "MCP Docs" öğesine tıkla.
- URL `/mcp` olur.

---

## Kurallar

- **baseURL:** `http://localhost:5173` (Vite dev server).
- **Browser:** Tek browser yeterli — Chromium.
- **İzolasyon:** Her test `beforeEach` ile `localStorage.clear()` çağırır (`persistence.spec.ts` hariç).
- **CI:** Headless modda çalışır.
- **Retry:** Flaky test'lere `retry: 2` uygulanır.
- **Timeout:** Test başına max 30 saniye.

---

## package.json Script'leri

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```
