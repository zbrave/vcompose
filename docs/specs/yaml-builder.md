# Spec: YAML Builder

> İlgili kod: `src/lib/yaml-builder.ts`
> Tip referansı: `docs/TYPES.md`
> Test dosyası: `src/lib/__tests__/yaml-builder.test.ts`

---

## Sorumluluk

`buildYaml(store)` — store state'ini alır, geçerli bir `docker-compose.yml` string'i döner. Pure function. Side effect yok. Store içinden çağrılmaz.

```typescript
import type { AppStore } from '../store/types';
export function buildYaml(store: Pick<AppStore, 'nodes' | 'edges' | 'networks' | 'namedVolumes'>): string
```

---

## Çıktı Formatı

```yaml
services:
  <serviceName>:
    image: <image>
    ports:
      - "<host>:<container>"
    volumes:
      - "<source>:<target>"
    environment:
      KEY: value
    healthcheck:
      test: ["CMD", "..."]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      - <otherService>
    networks:
      - <networkName>

networks:
  <networkName>:
    driver: bridge

volumes:
  <namedVolume>:
    driver: local
```

---

## Kurallar

### Zorunlu
- Top-level `version` alanı eklenmez — Compose Specification'da artık gerekli değil.
- `services:` bloğu her zaman var — boş olsa bile.
- `serviceName` YAML key olarak kullanılır (node id değil).

### Koşullu Bloklar
- `ports` dizisi boşsa → YAML'a eklenmez.
- `volumes` dizisi boşsa → YAML'a eklenmez.
- `environment` objesi boşsa → YAML'a eklenmez.
- `healthcheck` tanımlı değilse → YAML'a eklenmez.
- `depends_on` edge'lerden türetilir; boşsa → YAML'a eklenmez.
- `networks` bloğu: en az bir servis bir network'e bağlıysa eklenir.
- Top-level `volumes` bloğu: en az bir named volume varsa eklenir.

### Named Volume Tespiti
`VolumeMapping.source` değeri `/` veya `.` içermiyorsa named volume kabul edilir ve top-level `volumes:` bloğuna eklenir.

Örnekler:
- `./data` → host bind mount, top-level'a eklenmez
- `/var/data` → host bind mount, top-level'a eklenmez
- `postgres_data` → named volume ✅

### depends_on Üretimi
`edges` dizisini dolaş. Her edge için:
- `target` node'un service tanımına `depends_on: [source.serviceName]` ekle.
- Birden fazla edge varsa liste büyür.

### Sıralama
- Servisler `serviceName` alfabetik sırasına göre yazılır (deterministik çıktı için).

---

## Edge Cases

| Durum | Davranış |
|---|---|
| Hiç node yok | Sadece `version` ve boş `services:` |
| `image` boş | Alan yine de yazılır: `image: ''` |
| Aynı named volume iki serviste | Top-level'da sadece bir kez tanımlanır |
| Servis kendi kendine depends_on | Validator yakalar, builder yine de yazar |
| Port formatı sadece container (örn. "80") | `"80:80"` olarak normalize edilir |
