# Responsive & Cross-Browser Fixes — Design Spec

> **Tarih:** 2026-03-28
> **Kapsam:** YAML panel responsive davranışı, text wrapping, ServiceNode genişlik kısıtı, toggle keşfedilebilirliği

---

## Problem

1. **YAML panel text overflow:** Dar ekranlarda (tablet/telefon) YAML satırları panelden taşıyor, yatay scroll çıkmıyor
2. **Firefox/Linux node genişliği:** `GlassServiceNode` `minWidth: 160px` var ama `maxWidth` yok — Firefox farklı intrinsic sizing hesabı yapıyor, kartlar çok genişleyebiliyor
3. **YAML panel kayboluyor:** 768px altında `hidden md:flex` ile panel tamamen kayboluyor — kullanıcı YAML'ı göremez
4. **Toggle keşfedilebilirliği:** Header'daki `<Code size={15}>` ikonu küçük ve ne işe yaradığı belli değil

---

## Çözüm

### 1. Collapsible YAML Tab (Dar Ekranlar)

**Davranış:**
- `md` breakpoint (768px) altında YAML paneli otomatik collapse olur
- Ekranın sağ kenarında dikey **"YAML ✓/⚠/❌"** tab butonu kalır (validation durumuna göre ikon değişir)
- Tab'a tıklayınca YAML paneli slide-in overlay olarak açılır (sağdan sola)
- Arkada semi-transparent backdrop, tıklayınca panel kapanır
- Sidebar'ın sol taraftaki davranışıyla tutarlı UX

**Glow Pulse Animasyonu:**
- Tab butonu subtle gold/accent renkli pulse glow efekti ile yanıp söner
- `@keyframes` ile `box-shadow` animate edilir — `0% → rgba(212,168,67,0.1)`, `50% → rgba(212,168,67,0.4)`, `100% → rgba(212,168,67,0.1)`
- Animasyon süresi: ~2s, infinite, kullanıcı paneli bir kez açtıktan sonra durur (opsiyonel)

**Header Değişikliği:**
- `HeaderBar.tsx`'deki mobile YAML toggle butonu (`<Code>` ikonu, satır 66-72) kaldırılır
- `CanvasLayout.tsx`'deki `onYamlToggle` ve `showYaml` prop'ları temizlenir

**Dosyalar:**
- `src/components/CanvasLayout.tsx` — Yeni collapsible tab bileşeni eklenir, mobile overlay mantığı güncellenir
- `src/components/HeaderBar.tsx` — Mobile YAML toggle kaldırılır
- `src/components/output/YamlOutput.tsx` — Değişiklik yok (panel içeriği aynı kalır)

---

### 2. YAML Text Word Wrap

**Davranış:**
- `react-syntax-highlighter`'a `wrapLongLines={true}` prop'u eklenir
- Custom style'a `whiteSpace: 'pre-wrap'`, `wordBreak: 'break-all'` eklenir
- Uzun satırlar (environment değerleri, volume path'leri vb.) alt satıra kayar
- Hem desktop (260px panel) hem mobile overlay'de geçerli
- Horizontal scroll tamamen kaldırılır

**Dosyalar:**
- `src/components/output/YamlOutput.tsx` — Syntax highlighter props ve custom style güncellenir

---

### 3. ServiceNode maxWidth Constraint

**Davranış:**
- `GlassServiceNode` inline style'ına `maxWidth: '280px'` eklenir
- Mevcut `minWidth: '160px'` korunur — node genişliği 160px-280px arasında kalır
- Uzun servis adları ve image adları `text-overflow: ellipsis` ile kesilir (zaten mevcut, maxWidth ile tetiklenir)
- Tüm tarayıcılarda (Chrome, Firefox, Safari) tutarlı görünüm

**Dosyalar:**
- `src/components/canvas/GlassServiceNode.tsx` — `maxWidth` eklenir (satır ~60)

---

### 4. Toggle Keşfedilebilirliği

- Madde 1'deki collapsible YAML tab ile çözülür
- Dikey tab + glow pulse animasyonu header ikonundan çok daha belirgin
- Ek değişiklik gerekmez

---

## Etkilenen Dosyalar

| Dosya | Değişiklik |
|---|---|
| `src/components/CanvasLayout.tsx` | Collapsible YAML tab eklenir, mobile overlay güncellenir |
| `src/components/HeaderBar.tsx` | Mobile YAML toggle kaldırılır |
| `src/components/output/YamlOutput.tsx` | `wrapLongLines` + style güncellenir |
| `src/components/canvas/GlassServiceNode.tsx` | `maxWidth: '280px'` eklenir |

---

## Kapsam Dışı

- Desktop YAML panel genişliğini değiştirmek (260px kalır)
- Sidebar responsive davranışını değiştirmek (zaten çalışıyor)
- FloatingConfigPanel responsive davranışı (zaten çalışıyor)
- Yeni breakpoint eklemek (mevcut `md: 768px` yeterli)
