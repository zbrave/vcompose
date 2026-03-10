# Spec: Edge Logic

> İlgili kod: `src/components/canvas/`, `src/store/index.ts`
> Tip referansı: `docs/TYPES.md` → `DependencyEdge`, `NetworkConfig`

---

## Sorumluluk

Canvas üzerinde iki node arasında ok (edge) çizildiğinde tetiklenen iş mantığı. React Flow'un `onConnect` callback'i üzerinden yönetilir.

---

## Edge Oluşturma

Kullanıcı Node A'dan Node B'ye ok çektiğinde:

1. `DependencyEdge` objesi oluşturulur:
   ```
   { id: uuid(), source: A.id, target: B.id, type: 'dependencyEdge' }
   ```
2. Edge store'a eklenir (`addEdge`).
3. `default` network yoksa otomatik oluşturulur:
   ```
   { name: 'default', driver: 'bridge' }
   ```
4. Node A ve Node B'nin `networks` dizisine `'default'` eklenir (eğer zaten yoksa).

> **Not:** `depends_on` doğrudan store'da tutulmaz. `buildYaml()` edges'ten türetir.

---

## Edge Silme

Edge silindiğinde:
1. Store'dan `removeEdge` çağrılır.
2. İlgili node'ların `networks` dizisi **temizlenmez** — bir node başka edge'lere sahip olabilir.
3. Eğer hiç edge kalmadıysa `default` network **kaldırılmaz** — kullanıcı elle node eklemişse kaybolmamalı.

> Network temizliği Phase 3'te (Network Management UI) ele alınacak.

---

## Kısıtlamalar (MVP)

- Bir node kendine bağlanamaz (React Flow handle'larla engellenir, validator da yakalar).
- Aynı iki node arasında birden fazla edge çizilemez (React Flow `onConnect`'te kontrol edilir).
- Circular dependency tespit edilmez (Non-Goal).

---

## React Flow Entegrasyonu

```typescript
// Canvas component içinde
const onConnect = useCallback((params: Connection) => {
  if (params.source === params.target) return; // self-loop engelle

  const existingEdge = edges.find(
    e => e.source === params.source && e.target === params.target
  );
  if (existingEdge) return; // duplicate engelle

  store.addEdge({
    id: crypto.randomUUID(),
    source: params.source!,
    target: params.target!,
    type: 'dependencyEdge',
  });
}, [edges, store]);
```

---

## Görsel

- Edge tipi: animated dashed line (React Flow `animated: true`).
- Ok ucu: target node'a doğru.
- Hover'da sil butonu gösterilir.
