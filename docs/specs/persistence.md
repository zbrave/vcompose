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

## Test

localStorage persistence için ayrı birim test yazılmaz (Zustand middleware'in kendi testi var). Playwright E2E testlerinde sayfa yenileme sonrası veri korunması kontrol edilir (`e2e/flows/persistence.spec.ts`).
