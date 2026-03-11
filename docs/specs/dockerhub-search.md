# Docker Hub Search — Feature Spec

> Phase 4: ConfigPanel image alanında Docker Hub autocomplete

---

## Genel Bakış

Custom preset kullanıcıları (ve preset olmayan image alanı düzenleyenler) image adı yazarken Docker Hub'dan otomatik öneri alır. Minimum 2 karakter sonrası 300ms debounce ile arama yapılır.

---

## API

- **Endpoint:** `https://hub.docker.com/v2/search/repositories/?query={q}&page_size=10`
- **Method:** GET
- **Auth:** Gerektirmez (public)
- **CORS:** Tarayıcıdan doğrudan erişim; engellenirse kullanıcıya bilgi verilir

### Response Format

```json
{
  "results": [
    {
      "repo_name": "library/nginx",
      "short_description": "Official build of Nginx.",
      "star_count": 18000,
      "is_official": true,
      "is_automated": false
    }
  ]
}
```

### Parse Edilen Alanlar

```typescript
export interface DockerHubResult {
  name: string;           // repo_name (library/ prefix kaldırılır)
  description: string;    // short_description
  starCount: number;      // star_count
  isOfficial: boolean;    // is_official
}
```

---

## Bileşenler

### 1. `src/lib/dockerhub.ts`
- `searchImages(query: string): Promise<DockerHubResult[]>`
- `library/` prefix'i official image'lardan kaldırılır
- Fetch hatası → boş array döner (UI'da error gösterilmez)
- AbortController ile önceki isteği iptal eder

### 2. `src/hooks/useDockerHubSearch.ts`
- Input: `query: string`
- Output: `{ results: DockerHubResult[], isLoading: boolean }`
- Debounce: 300ms
- Min karakter: 2
- Query değişince önceki istek iptal edilir

### 3. `src/components/panel/ImageSearchInput.tsx`
- Mevcut input stilini korur (`inputCls`)
- Dropdown: absolute positioned, dark theme
- Her satır: image adı, kısa description (truncated), star count, official badge (✓)
- Keyboard: ↑↓ navigasyon, Enter seçim, Escape kapatma
- Click: seçim yapar, dropdown kapanır
- Blur: dropdown kapanır (küçük delay ile click'in çalışmasını sağla)
- `disabled` prop destekler (preset image'lar için)

---

## Davranış Kuralları

1. Preset node'larda (`isPreset=true`) image alanı disabled, arama çalışmaz
2. Kullanıcı tag yazabilir: "nginx:alpine" → "nginx" ile arama, seçince tag korunmaz (tam repo adı gelir)
3. Boş sonuç → dropdown gösterilmez
4. Network hatası → sessizce başarısız olur, input normal çalışmaya devam eder

---

## Test Planı

### Unit (Vitest)
- `searchImages`: mock fetch, response parse doğruluğu
- `searchImages`: `library/` prefix kaldırma
- `searchImages`: fetch hatası → boş array

### E2E (Playwright)
- Custom node ekle → image alanına "redis" yaz → dropdown görünsün
