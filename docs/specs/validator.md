# Spec: Validator

> İlgili kod: `src/lib/validator.ts`
> Tip referansı: `docs/TYPES.md` → `ValidationIssue`
> Test dosyası: `src/lib/__tests__/validator.test.ts`

---

## Sorumluluk

`validate(store)` — store state'ini alır, `ValidationIssue[]` döner. Pure function. Sonuçlar store'a root component'taki `useEffect` içinden yazılır.

```typescript
import type { AppStore, ValidationIssue } from '../store/types';
export function validate(store: Pick<AppStore, 'nodes' | 'edges'>): ValidationIssue[]
```

---

## MVP Validation Kuralları

### 1. service_name Benzersizliği
- **Severity:** `error`
- **Kontrol:** İki node aynı `serviceName`'e sahipse her ikisi için hata üret.
- **Message:** `"Service name '{{name}}' is already used by another service."`
- **Field:** `serviceName`

### 2. depends_on Referans Geçerliliği
- **Severity:** `error`
- **Kontrol:** Bir edge'in `source` id'si `nodes` dizisinde mevcut değilse hata üret.
- **Message:** `"depends_on references a service that does not exist."`
- **nodeId:** Edge `target` node'u

### 3. Port Formatı
- **Severity:** `warning`
- **Kontrol:** `PortMapping.host` veya `PortMapping.container` sayısal değilse uyarı ver.
- **Message:** `"Port '{{value}}' is not a valid number."`
- **Field:** `ports`

### 4. Image Boş
- **Severity:** `warning`
- **Kontrol:** `ServiceNodeData.image` boş string ise uyarı ver.
- **Message:** `"Image is not defined for service '{{serviceName}}'."`
- **Field:** `image`

### 5. Hiç Servis Yok
- **Severity:** `warning`
- **Kontrol:** `nodes` dizisi boşsa genel uyarı ver (nodeId yok).
- **Message:** `"No services defined yet."`

---

## Çıktı Kullanımı

YAML Output Panel'de:
- `error` varsa → ❌ kırmızı badge
- Sadece `warning` varsa → ⚠️ sarı badge
- Hiç sorun yoksa → ✅ yeşil badge

Her issue node üzerinde de gösterilir (node'da kırmızı/sarı nokta).
