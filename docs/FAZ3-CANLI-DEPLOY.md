# Faz 3 — Canlıya alma (RusWallet)

**Hedef mimari (önerilen — Azure):**

| Bileşen | Servis | URL örneği |
|---------|--------|------------|
| API | Azure App Service (Linux, .NET 10) | `https://ruswallet-api.azurewebsites.net` |
| Veritabanı | Azure SQL Database | (connection string App Service’e env olarak) |
| Web | Azure Static Web Apps **veya** aynı App Service’e statik dosya | `https://ruswallet-web.azurestaticapps.net` |

Kendi alan adın yoksa bile `*.azurewebsites.net` ile **gerçek canlı** ortam çalışır; domain’i sonra bağlarsın.

---

## 0. Ön koşullar

- [ ] [Azure hesabı](https://azure.microsoft.com/free/) (ücretsiz deneme yeterli)
- [ ] GitHub repo: `https://github.com/aleynatombas/RusWallet`
- [ ] Güçlü JWT secret (en az 32 karakter) — örn. PowerShell:  
  `[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))`

---

## 1. Azure SQL Database

1. Portal → **Create a resource** → **SQL Database**
2. **Server** oluştur (ör. `ruswallet-sql`), bölge: West Europe
3. **Authentication:** SQL login + şifre (kaydet)
4. Database: `RusWalletDb`, tier: Basic veya General Purpose (dev canlı için Basic yeter)
5. **Networking:** “Allow Azure services and resources to access this server” = **Yes**
6. Connection string (ADO.NET):

   `Server=tcp:ruswallet-sql.database.windows.net,1433;Initial Catalog=RusWalletDb;User ID=...;Password=...;Encrypt=True;TrustServerCertificate=False;`

---

## 2. Azure App Service (API)

1. **Create** → **Web App**
2. Runtime: **.NET 10 (Preview)** veya mevcut en yüksek .NET Linux stack
3. Plan: B1 (ücretli, küçük) veya F1 (sınırlı; prod için B1 önerilir)
4. **Configuration** → Application settings (Production):

| Name | Value |
|------|--------|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ConnectionStrings__DefaultConnection` | (Azure SQL connection string) |
| `Jwt__Key` | (32+ char secret) |
| `Jwt__Issuer` | `RusWalletAPI` |
| `Jwt__Audience` | `RusWalletUsers` |
| `Jwt__AccessTokenMinutes` | `30` |
| `Cors__AllowedOrigins__0` | Web canlı URL (aşağıda; önce geçici `http://localhost:3000` ile test edebilirsin) |
| `Features__EnableSwagger` | `false` |
| `Database__ApplyMigrationsOnStartup` | `true` (ilk deploy) |
| `App__PublicWebBaseUrl` | Web URL |

5. **Deployment Center** → GitHub → repo `RusWallet`, workflow: `.github/workflows/azure-api.yml` (repoda)

**İlk migration:** `Database__ApplyMigrationsOnStartup=true` ile uygulama açılışında EF migration çalışır. Canlı stabil olduktan sonra `false` yap.

**Smoke test:**

```text
GET https://ruswallet-api.azurewebsites.net/health
→ Healthy
```

---

## 3. Web (statik React build)

### Seçenek A — Azure Static Web Apps (önerilen)

1. Portal → **Static Web App** → GitHub `RusWallet`
2. App location: `frontend/web`, output: `dist`
3. Build command: `yarn install && yarn build`
4. **Configuration** → Environment variable:  
   `VITE_API_BASE_URL` = `https://ruswallet-api.azurewebsites.net` (**sonunda / yok**)
5. Deploy sonrası SWA URL’ini kopyala → App Service’te `Cors__AllowedOrigins__0` ve `App__PublicWebBaseUrl` güncelle → API **restart**

### Seçenek B — Manuel build (PC’den)

```powershell
cd frontend\web
$env:VITE_API_BASE_URL="https://ruswallet-api.azurewebsites.net"
yarn install
yarn build
```

`dist/` klasörünü SWA / Netlify / Cloudflare Pages’e yükle.

---

## 4. Mobil (sonra)

Release build:

```bash
EXPO_PUBLIC_API_URL=https://ruswallet-api.azurewebsites.net eas build ...
```

---

## 5. UAT checklist (canlıya çıkmadan önce)

- [ ] Kayıt + giriş + `refreshToken` (web Application → Local storage)
- [ ] Onboarding coachmark + tamamlama
- [ ] İşlem ekle / listele / sil
- [ ] Dashboard özet
- [ ] Analiz sayfası
- [ ] Ayarlar → şifre değiştir
- [ ] Ayarlar → hesap sil (test hesabı)
- [ ] `/health` = Healthy
- [ ] Swagger kapalı (prod)
- [ ] Yanlış origin’den API çağrısı CORS ile reddediliyor

---

## 6. Domain + SSL (isteğe bağlı)

- App Service → **Custom domains** → CNAME → Azure managed certificate
- Web (SWA) → **Custom domains** → aynı şekilde
- CORS ve `App__PublicWebBaseUrl` değerlerini `https://app.alanadin.com` yap

---

## 7. İzleme (ilk hafta)

- App Service → **Log stream** / Application Insights (açılabilir)
- Azure SQL → DTU/CPU alarmı
- `/health` için uptime ping (UptimeRobot vb.)

---

## Alternatif: Tek VPS (Docker)

Docker kurulu Linux VPS’te repo kökünde:

```bash
cp deploy/.env.production.example deploy/.env.production
# düzenle
docker compose -f deploy/docker-compose.prod.yml up -d
```

Detay: `deploy/README.md`

---

Sorun çıkarsa: API **Log stream**, web **Network** sekmesi (CORS / 401), SQL firewall kuralları.
