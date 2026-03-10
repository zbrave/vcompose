# Network Management UI Spec

> Phase 3 feature. Kullanicilar network'leri olusturabilir, silebilir, driver secebilir ve servisleri network'lere atayabilir.

---

## UI Konumu

### 1. NetworkPanel (sidebar alt kismi)
- Sidebar'da NodePalette'in altinda, ayri bir section
- Mevcut network'leri listeler
- Her network icin: ad, driver, silme butonu
- "Add Network" butonu ile yeni network olusturma
- Yeni network: name input + driver select (bridge/overlay/host/none)

### 2. ConfigPanel'e Networks Bölümü
- Mevcut service'in ait oldugu network'leri checkbox listesi olarak gosterir
- Store'daki `networks` listesindeki tum network'ler listelenir
- Checkbox toggle ile service `data.networks` array'ine ekleme/cikarma

---

## Store Actions (mevcut)

Zaten var:
- `addNetwork(network: NetworkConfig)`
- `removeNetwork(name: string)`

Yeni:
- `updateNetwork(oldName: string, network: NetworkConfig)` — rename + driver degisikligi

---

## Validation

- Network silme: eger bir service o network'e ait ise uyari goster (ama engelleme)
- Ayni isimde network eklemeyi engelle

---

## Edge Cases

- `default` network auto-created by edge logic — silinebilir ama depends_on olan node'lar kalir
- Network rename: tum service'lerin `data.networks` array'i guncellenmeli
- Bos network listesi: "No networks yet" mesaji
