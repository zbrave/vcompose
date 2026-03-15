# Spec: Configuration Panel

> İlgili kod: `src/components/panel/`
> Tip referansı: `docs/TYPES.md` → `ServiceNodeData`, `HealthcheckConfig`

---

## Sorumluluk

Seçili node'un verilerini düzenlemek için açılan yan panel. Store üzerinden `updateNode` çağırır. Hiçbir iş mantığı içermez — sadece form → store köprüsüdür.

---

## Panel Açılma / Kapanma

- `store.selectedNodeId` null değilse panel görünür.
- Canvas boş alana tıklanınca `selectNode(null)` çağrılır, panel kapanır.
- Panel sağ taraftan slide-in animasyonuyla açılır (Tailwind transition).

---

## Alanlar

### service_name
- Input: `text`
- Validation: boş olamaz, sadece `[a-z0-9_-]` karakterleri (docker-compose kuralı)
- Hata: inline, kırmızı metin
- Store güncelleme: `onChange` her değişimde (debounce gerekmez)

### image
- Input: `text`
- Preset node'larda (nginx, postgres vb.): **disabled**, değer gösterilir
- Custom node'da: düzenlenebilir, boş bırakılabilir (validator uyarır)

### ports
- Dinamik satır listesi: `host` ve `container` ayrı input'lar
- "Add Port" butonu yeni boş satır ekler
- Satır başındaki ✕ ile silinir
- Validation: her iki alan da sayısal olmalı (validator uyarır)

### volumes
- Dinamik satır listesi: `source` ve `target` ayrı input'lar
- "Add Volume" butonu yeni boş satır ekler
- Satır başındaki ✕ ile silinir
- Source format hint: "host/path veya named-volume"

### environment
- Dinamik key-value çiftleri: `KEY` ve `value` ayrı input'lar
- "Add Variable" butonu yeni boş satır ekler
- Satır başındaki ✕ ile silinir
- KEY validation: sadece `[A-Z0-9_]` kabul edilir (uyarı, bloke değil)

### healthcheck
- Toggle ile açılır/kapanır (kapalıyken store'a `undefined` yazılır)
- Açıkken dört alan: `test` (text), `interval` (text, örn. "30s"), `timeout` (text), `retries` (number)
- Format hint her alanın altında gösterilir

---

## Preset Defaults Hatırlatma

Preset seçildikten sonra panel açıldığında alanlar `docs/TYPES.md`'deki `PRESET_DEFAULTS` değerleriyle dolu gelir.

---

## UX Kuralları

- Her değişiklik anında store'a yansır (controlled inputs).
- "Save" butonu yoktur — auto-save.
- Panel içinde scroll desteklenir (uzun formlar için).
- 21st.dev Magic MCP'den: input, label, toggle, icon-button component'ları kullanılır.
