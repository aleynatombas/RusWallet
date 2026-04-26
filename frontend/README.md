# RusWallet Frontend – Web & Mobil

Bu klasörde **web** ve **mobil** iki ayrı uygulama var; ikisi de aynı backend API’yi kullanır.

---

## Yapı

| Uygulama | Teknoloji | Port / Ortam | Klasör |
|----------|-----------|--------------|--------|
| **Web** | React + Vite + TypeScript + Tailwind | http://localhost:3000 | `web/` |
| **Mobil** | React Native (Expo) + TypeScript | Metro / cihaz | `mobile/` |
| **Backend API** | .NET 10 | http://localhost:5140 | `../backend/RusWallet.API` |

---

## Nasıl çalıştırılır?

### 1. Backend (önce buna ihtiyaç var)

```bash
cd backend/RusWallet.API
dotnet run
```

API: **http://localhost:5140** — Swagger: `/swagger`

### 2. Web

```bash
cd frontend/web
yarn install   # ilk seferde
yarn dev
```

Tarayıcı: **http://localhost:3000**  
Vite, `/api` isteklerini `http://localhost:5140` adresine proxy eder.

### 3. Mobil (Expo)

```bash
cd frontend/mobile
yarn install   # ilk seferde
yarn start
```

---

## Kimlik ve dashboard

- **Auth:** Kayıt / giriş sonrası JWT `localStorage` (web) veya `AsyncStorage` (mobil) içinde saklanır; `axios` interceptor ile isteklere eklenir.
- **Dashboard:** Giriş sonrası ana ekranda finans özeti (`GET /api/Analysis/summary`), son işlemler (`GET /api/Transaction?period=30`) ve hızlı işlem ekleme (`POST /api/Transaction/add`) çağrılır.

### UI (web + mobil aynı akış)

- **Web:** [shadcn/ui](https://ui.shadcn.com/docs/components/radix/button) bileşenleri (`Button`, `Card`, `Input`, `Label`) — ör. `frontend/web/src/components/ui/`, dashboard: `DashboardComponent`.
- **Mobil:** React Native Paper ile aynı bölümler (başlık, özet kartları, Gelir/Gider segment düğmeleri, form, işlem listesi); dosya: `MobileDashboardComponent`.

---

## Base URL

| Ortam | Base URL |
|--------|----------|
| Web (dev) | `/api` (proxy → 5140) |
| Mobil – fiziksel cihaz | Bilgisayarın yerel IP’si, örn. `http://192.168.1.x:5140` |
| Mobil – Android emülatör | `http://10.0.2.2:5140` |
| Mobil – iOS Simulator (Mac) | Genelde `http://localhost:5140` |

Mobil adres **`mobile/src/config/api.ts`** içindeki `DEV_HOST` ile ayarlanır. **Wi‑Fi veya ağ değişince** bilgisayarda `ipconfig` ile IPv4’ü güncelle; aksi halde `Network Error` alırsın. Windows’ta gerekirse 5140 için inbound firewall kuralı açılır.

---

## Kontrol listesi (mobil bağlanmıyorsa)

1. Telefon ve PC aynı Wi‑Fi’da mı?
2. `api.ts` içindeki IP güncel mi? (`ipconfig` → Wi‑Fi IPv4)
3. Backend çalışıyor mu? (`dotnet run`)
4. Telefon tarayıcısından `http://<IP>:5140/swagger` açılıyor mu?
5. Gerekirse: `npx expo start -c`

---

## Web & Mobil uyum

| Kontrol | Web | Mobil |
|--------|-----|--------|
| Auth (login/register) | ✅ | ✅ |
| Dashboard: özet + işlemler + ekle | ✅ | ✅ |
| Backend port | 5140 (proxy) | `api.ts` |

---

## Web ekran dokümantasyonu (SS iskeleti)

Ekran görüntülü anlatım için alt başlık yapısı: **`web/WEB-EKRAN-DOKUMANTASYONU.md`**.

## İleride genişletilebilir

- Grafikler, kategori yönetimi ekranı, analiz/tahmin/chatbot sayfaları, fiş yükleme (camera/image picker) UI.
