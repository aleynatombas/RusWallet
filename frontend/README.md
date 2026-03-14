# RusWallet Frontend – Web & Mobil Yönetimi

Bu klasörde **web** ve **mobil** iki ayrı uygulama var; ikisi de aynı backend API'yi kullanır.

---

## Yapı

| Uygulama | Teknoloji | Port / Ortam | Klasör |
|----------|-----------|--------------|--------|
| **Web** | React + Vite + TypeScript + Tailwind | http://localhost:3000 | `web/` |
| **Mobil** | React Native (Expo) + TypeScript | Metro / cihaz emülatör | `mobile/` |
| **Backend API** | .NET 10 | http://localhost:5140 | `../backend/RusWallet.API` |

---

## Nasıl çalıştırılır?

### 1. Backend (önce buna ihtiyaç var)

```bash
cd backend/RusWallet.API
dotnet run
```

API: **http://localhost:5140**

---

### 2. Web

```bash
cd frontend/web
yarn install   # ilk seferde
yarn dev
```

Tarayıcı: **http://localhost:3000**  
Web, `/api` isteklerini otomatik olarak `http://localhost:5140`'a proxy eder.

---

### 3. Mobil (React Native – Expo)

```bash
cd frontend/mobile
yarn install   # ilk seferde
yarn start
```

- Emülatör veya fiziksel cihazda Expo Go ile açılır.
- **API adresi:** Mobilde proxy yok; API base URL ortam değişkeni ile ayarlanır (aşağıda).

---

## Paylaşılan kurallar (Web + Mobil)

- **Aynı API:** Auth, işlemler, kategoriler, analiz, chatbot, fiş OCR vb. hepsi aynı endpoint’ler.
- **JWT:** Login sonrası token alınır; isteklerde `Authorization: Bearer <token>` kullanılır.
- **Base URL:**
  - Web: geliştirmede `/api` (Vite proxy → 5140).
  - Mobil: `http://localhost:5140` (emülatör) veya bilgisayarın IP’si (fiziksel cihaz, örn. `http://192.168.1.x:5140`).

Mobilde API base URL **`mobile/src/config/api.ts`** içinde; `API_BASE_URL` değiştirilebilir. Android emülatörde `http://10.0.2.2:5140` gerekebilir.

---

## Mobil kurulum sırası (React Native – Expo)

Mobil proje henüz oluşturulmadıysa:

1. **Expo ile proje oluştur (TypeScript):**
   ```bash
   cd frontend
   npx create-expo-app@latest mobile --template blank-typescript
   cd mobile
   yarn install
   ```

2. **Yarn kullanımı:** `package.json` içine `"packageManager": "yarn@1.22.22"` eklenebilir (web ile aynı).

3. **API client:** `axios` veya `fetch` + base URL config; token’ı login sonrası saklayıp her istekte header’a eklemek.

4. **Ortam değişkeni (API URL):** `expo-constants` veya `react-native-dotenv` ile `API_BASE_URL` okunabilir.

Bu adımları tamamladıktan sonra ekranlar ve navigasyon (React Navigation) eklenerek web ile paralel ilerlenebilir.

---

## Web & Mobil uyum durumu

| Kontrol | Web | Mobil |
|--------|-----|--------|
| Başlangıç ekranı | "RusWallet" (Tailwind) | "RusWallet" (aynı marka) |
| Backend port | 5140 (proxy) | 5140 (`src/config/api.ts`) |
| packageManager | yarn@1.22.22 | yarn@1.22.22 |
| Proje adı | ruswallet-web | ruswallet-mobile |
| API client / Auth | Henüz yok | Henüz yok |

İkisi de aynı noktada: sadece başlangıç ekranı, backend’e bağlanan kod yok. API ve auth eklendiğinde aynı endpoint’ler kullanılacak.
