# RusWallet — Ortam değişkenleri ve deploy notları

## API (ASP.NET Core)

| Ayar | Açıklama | Örnek |
|------|-----------|--------|
| `ASPNETCORE_ENVIRONMENT` | `Development` / `Production` | `Production` |
| `ConnectionStrings__DefaultConnection` | SQL Server | `Server=...;Database=RusWalletDb;...` |
| `Jwt__Key` | HMAC secret (≥32 karakter) | User Secrets / Key Vault |
| `Encryption__Key` | Finansal alanlar için AES-256 anahtarı | User Secrets / Key Vault |
| `Jwt__Issuer` | JWT issuer | `RusWalletAPI` |
| `Jwt__Audience` | JWT audience | `RusWalletUsers` |
| `Jwt__AccessTokenMinutes` | Access token süresi | `30` (prod öneri) |
| `Jwt__RefreshTokenDays` | Refresh süresi | `14` |
| `Cors__AllowedOrigins__0` | Web origin | `https://app.example.com` |
| `Features__EnableSwagger` | Swagger UI | `false` (prod) |
| `OpenAI__ApiKey` | Opsiyonel | |
| `Email__SmtpHost` | Şifre sıfırlama e-postası | |
| `Email__SmtpUser` | SMTP kullanıcı adı | |
| `Email__SmtpPassword` | SMTP şifresi (uygulama şifresi) | User Secrets / Key Vault |
| `App__PublicWebBaseUrl` | E-posta linkleri | `https://app.example.com` |

Production’da `appsettings.Production.json` şablonu vardır; **secret’ları ortam değişkeni** ile verin.

### Development (User Secrets)

`appsettings.json`/`appsettings.Development.json` dosyalarında `Jwt:Key`, `Encryption:Key`, `Email:SmtpUser`, `Email:SmtpPassword` boş bırakılır; gerçek değerler **User Secrets**'tan okunur (csproj'da `UserSecretsId` zaten tanımlı, Development ortamında otomatik yüklenir):

```powershell
cd backend/RusWallet.API
dotnet user-secrets set "Jwt:Key" "<en az 32 karakterlik rastgele değer>"
dotnet user-secrets set "Encryption:Key" "<mevcut AES anahtarı — değiştirme, aynen taşı>"
dotnet user-secrets set "Email:SmtpUser" "<smtp kullanıcı adı>"
dotnet user-secrets set "Email:SmtpPassword" "<smtp şifresi>"
```

### Migration

```powershell
.\scripts\deploy-migrate.ps1
```

### Health

`GET /health` — veritabanı bağlantısı dahil.

---

## Web (Vite)

| Dosya / değişken | Açıklama |
|------------------|----------|
| `.env.production` | `VITE_API_BASE_URL=https://api.example.com` |
| Geliştirme | Boş bırakın → Vite proxy `/api` → `localhost:5140` |

---

## Mobil (Expo)

| Değişken | Açıklama |
|----------|----------|
| `EXPO_PUBLIC_API_URL` | Release build API kökü ( `/api` eklenmez, kod ekler) |

Geliştirmede `frontend/mobile/src/config/api.ts` içindeki `DEV_HOST` / emülatör ayarları.

---

## HTTPS, yedek, log

- API’yi reverse proxy (IIS, nginx, Azure App Service) arkasında **HTTPS** ile yayınlayın.
- SQL Server **günlük yedek** + staging’de migration smoke test.
- Production log seviyesi `appsettings.Production.json` içinde `Warning`; isteğe bağlı Application Insights / Serilog eklenebilir.
