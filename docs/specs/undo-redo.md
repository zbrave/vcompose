# Undo/Redo — Feature Spec

> Phase 5: Zustand temporal middleware ile undo/redo

---

## Genel Bakış

Canvas üzerindeki tüm state değişiklikleri (node ekleme/silme, edge ekleme/silme, config değişiklikleri, network değişiklikleri) geri alınabilir ve yeniden uygulanabilir.

---

## Mimari

- **Middleware:** `zundo` paketi, `temporal` middleware
- **Middleware sırası:** `persist(temporal(...))`  — store-rules.md ile uyumlu
- **Partialize:** Sadece `nodes`, `edges`, `networks`, `namedVolumes` track edilir
- **Transient state:** `selectedNodeId`, `validationIssues` undo/redo'dan etkilenmez

---

## UI

### UndoRedoToolbar (`src/components/canvas/UndoRedoToolbar.tsx`)
- Canvas sol üst köşede floating toolbar
- İki buton: Undo (↩) ve Redo (↪)
- Disabled state: pastStates/futureStates boşsa
- Reactive: `useStoreWithEqualityFn` ile temporal state dinlenir

### Keyboard Shortcuts
- `Ctrl+Z` / `Cmd+Z` → Undo
- `Ctrl+Y` / `Cmd+Y` / `Ctrl+Shift+Z` / `Cmd+Shift+Z` → Redo
- FlowCanvas içinde `useEffect` ile global keydown listener

---

## Davranış

1. Her store mutasyonu otomatik olarak history'e eklenir
2. Undo: son state'e geri döner
3. Redo: undo edilmiş state'i geri uygular
4. Yeni bir değişiklik yapılırsa futureStates temizlenir
5. localStorage persistence undo history'yi kapsamaz (sadece current state)
