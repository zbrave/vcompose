# Spec: localStorage Persistence

> İlgili kod: `src/store/index.ts`
> Tip referansı: `docs/TYPES.md` → `AppStore`
> Bağımlılık: Zustand `persist` middleware (built-in, ekstra paket yok)

---

## Sorumluluk

Zustand store'u `localStorage`'a otomatik kaydet, sayfa açıldığında geri yükle. Kullanıcı çalışmasını kaybetmez.

---

## Uygulama

### Store Tanımı

`create` yerine `create(persist(...))` kullanılır:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppStore } from './types';

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ... mevcut store tanımı
    }),
    {
      name: 'vdc-store',               // localStorage key
      version: 1,                      // migration desteği için
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        networks: state.networks,
        namedVolumes: state.namedVolumes,
      }),
    }
  )
);
```

---

## Kurallar

1. **Key:** `vdc-store` — kısa, benzersiz, sabit.
2. **partialize:** Sadece kalıcı veri kaydedilir. `selectedNodeId` ve `validationIssues` kaydedilmez (transient state).
3. **version:** `1` ile başlar. Store shape değişirse `migrate` fonksiyonu eklenir.
4. **Undo/Redo uyumu:** `temporal` middleware ile birlikte kullanılacaksa, `persist(temporal(...))` sıralaması uygulanır.
5. **Hata durumu:** `localStorage` dolu veya erişilemez ise sessizce devam et (Zustand persist default davranışı).

---

---

## sessionStorage: Routing Redirect Flag

### Amaç

İlk ziyaretçiye LandingPage gösterilir. Kullanıcı canvas'a geçtikten sonra (`/app`) sayfayı yenilerse veya `/` adresine doğrudan gelirse, LandingPage atlanır ve doğrudan `/app`'e yönlendirilir.

### Anahtar

```
vdc-entered
```

`sessionStorage`'da tutulur (sekme kapandığında temizlenir). `localStorage`'a yazılmaz.

### Redirect Mantığı — `LandingRedirect` (App.tsx)

Redirect mantığı route seviyesinde uygulanır; store başlatmasına veya component mount'una karışmaz.

```typescript
// App.tsx — / rotasında render edilen wrapper component
function LandingRedirect() {
  const entered = sessionStorage.getItem('vdc-entered');
  if (entered) {
    return <Navigate to="/app" replace />;
  }
  return <LandingPage />;
}
```

- `replace: true` kullanılır; bu sayede back-button `/` → `/app` → `/` döngüsü oluşmaz.
- LandingPage'deki "Start Building" butonu `sessionStorage.setItem('vdc-entered', '1')` çağırır, ardından `navigate('/app', { replace: true })` ile canvas'a geçer.

### Home'a Dönüşte Flag Temizleme

Kullanıcı canvas'tan Home'a döndüğünde (`/` adresine navigate edildiğinde), `vdc-entered` flag'i temizlenir; bir sonraki `/` ziyaretinde LandingPage tekrar gösterilir.

Bu temizleme şu iki noktada yapılır:

| Bileşen | Tetikleyici |
|---|---|
| `NavDropdown` (HeaderBar) | "Home" menü öğesine tıklanması |
| `CommandSearch` | "Go to Home" action seçilmesi |

```typescript
sessionStorage.removeItem('vdc-entered');
navigate('/', { replace: true });
```

### Kural Özeti

| Kural | Değer |
|---|---|
| Storage tipi | `sessionStorage` (sekme bazlı) |
| Key | `vdc-entered` |
| Set eden | LandingPage "Start Building" butonu |
| Silen | NavDropdown "Home" + CommandSearch "Go to Home" |
| Redirect uygulayan | `LandingRedirect` component (App.tsx, `/` rotası) |
| Redirect yöntemi | `<Navigate to="/app" replace />` |

---

## Test

localStorage persistence için ayrı birim test yazılmaz (Zustand middleware'in kendi testi var). Playwright E2E testlerinde sayfa yenileme sonrası veri korunması kontrol edilir (`e2e/flows/persistence.spec.ts`).

sessionStorage redirect mantığı `e2e/flows/routing.spec.ts` içindeki "Returning visitor auto-redirects to /app" testiyle doğrulanır.
