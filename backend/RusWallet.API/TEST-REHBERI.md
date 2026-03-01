# RusWallet API – Test Rehberi

Tüm bu endpoint'ler **JWT** istiyor (Chatbot, AI kategori, Analiz, Tahmin). Önce giriş yapıp token alacaksın, sonra her istekte `Authorization: Bearer <token>` göndereceksin.

---

## 1. API’yi çalıştır

```powershell
cd backend\RusWallet.API
dotnet run
```

Tarayıcıda aç: **https://localhost:7156/swagger** veya **http://localhost:5140/swagger**

---

## 2. Token al (Login)

Hesabın yoksa önce **Register**:

- **POST** `/api/Auth/register`  
  Body (JSON):
  ```json
  {
    "firstName": "Test",
    "lastName": "User",
    "email": "test@test.com",
    "password": "Test123!",
    "phoneNumber": "05551234567"
  }
  ```

Sonra **Login**:

- **POST** `/api/Auth/login`  
  Body (JSON):
  ```json
  {
    "email": "test@test.com",
    "password": "Test123!"
  }
  ```

Cevaptaki **token** değerini kopyala (örn. `eyJhbGciOiJIUzI1NiIs...`). Bunu aşağıdaki tüm korumalı isteklerde kullanacaksın.

---

## 3. Swagger ile test (en kolay)

1. Swagger sayfasında sağ üstte **Authorize**’a tıkla.
2. **Value** kutusuna sadece token’ı yapıştır (Bearer yazma, Swagger ekliyor):  
   `eyJhbGciOiJIUzI1NiIs...`
3. **Authorize** → **Close**.

Sonra sırayla dene:

| Ne test ediyorsun | Method | Endpoint | Body / Parametre |
|-------------------|--------|----------|-------------------|
| **Chatbot** | POST | `/api/Chatbot/ask` | `{ "message": "Bütçe nasıl yapılır?" }` |
| **AI kategori önerisi** | POST | `/api/AI/suggest-category` | `{ "description": "Migros market alışverişi" }` |
| **Analiz (özet)** | GET | `/api/Analysis/summary` | (body yok) |
| **Tahmin** | GET | `/api/Prediction/monthly?month=2025-03-01` | (body yok, sadece query) |

Her birinde **Execute** dediğinde 200 ve cevap JSON’u görmelisin.

---

## 4. PowerShell ile test (token’ı değiştir)

Önce token al (login cevabından `token` değerini al):

```powershell
$loginBody = '{"email":"test@test.com","password":"Test123!"}'
$loginResp = Invoke-RestMethod -Uri "https://localhost:7156/api/Auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResp.token
```

Sonra her özelliği tek tek dene:

**Chatbot:**
```powershell
$headers = @{ Authorization = "Bearer $token" }
$body = '{"message":"Bütçe nasıl yapılır?"}'
Invoke-RestMethod -Uri "https://localhost:7156/api/Chatbot/ask" -Method Post -Headers $headers -Body $body -ContentType "application/json"
```

**AI kategori önerisi:**
```powershell
$body = '{"description":"Migros market alışverişi"}'
Invoke-RestMethod -Uri "https://localhost:7156/api/AI/suggest-category" -Method Post -Headers $headers -Body $body -ContentType "application/json"
```

**Analiz (özet):**
```powershell
Invoke-RestMethod -Uri "https://localhost:7156/api/Analysis/summary" -Method Get -Headers $headers
```

**Tahmin:**
```powershell
Invoke-RestMethod -Uri "https://localhost:7156/api/Prediction/monthly?month=2025-03-01" -Method Get -Headers $headers
```

Not: HTTPS sertifika uyarısı alırsan ilk komutta ekle:  
`Invoke-RestMethod ... -SkipCertificateCheck` (PowerShell 6+).

---

## 5. Beklenen cevaplar (kısa)

- **Chatbot:** `{ "response": "Bütçe yapmak için: ..." }`
- **AI kategori:** `{ "predictedCategoryName": "Market", "isIncome": false }`
- **Analiz:** Gelir/gider toplamları, kategori dağılımı vb. (FinanceSummaryResponseDto)
- **Tahmin:** `estimatedAmount`, `month` vb. (PredictionResponseDto)

---

## 6. Denenecek chatbot mesajları

- "Bütçe nasıl yapılır?"
- "Harcamalarımı nasıl takip ederim?"
- "Kategori nasıl eklerim?"
- "Merhaba"
- "Tahmin nasıl kullanılır?"

Eşleşme yoksa: "Bu konuda hazır bir cevabım yok. Şunları sorabilirsiniz: ..." döner.

---

## 7. Denenecek AI kategori açıklamaları

- "Migros market" → Market, gider
- "Aylık maaş" → Maaş, gelir
- "Elektrik faturası" → Faturalar, gider
- "Benzin" → Ulaşım, gider

Böylece chatbot, tahmin, analiz ve AI kategori önerisini tek tek kontrol edebilirsin.
