# RusWallet API – Baştan Sona Test Senaryosu

Aşağıdaki adımları sırayla uygula. Swagger kullanıyorsan **Authorize** ile token'ı girdikten sonra her isteği **Execute** ile gönder.

---

## 0. API’yi başlat

```bash
cd backend\RusWallet.API
dotnet run
```

Tarayıcıda aç: **https://localhost:7156/swagger** (veya çıktıdaki URL).

---

## 1. Kayıt (Register)

| Adım | Değer |
|------|--------|
| **Method** | POST |
| **URL** | `/api/Auth/register` |
| **Body (JSON)** | Aşağıdaki gibi |

```json
{
  "firstName": "Test",
  "lastName": "Kullanici",
  "email": "test@ruswallet.com",
  "password": "Test123!",
  "phoneNumber": "05551234567"
}
```

**Beklenen:** 200 OK (token veya başarı mesajı).  
**Not:** Aynı email ile ikinci kez kayıt 400/409 verebilir; o zaman doğrudan 2. adıma geç.

---

## 2. Giriş (Login) – Token al

| Adım | Değer |
|------|--------|
| **Method** | POST |
| **URL** | `/api/Auth/login` |
| **Body (JSON)** | |

```json
{
  "email": "test@ruswallet.com",
  "password": "Test123!"
}
```

**Beklenen:** 200 OK, cevapta **token** alanı.  
**Yap:** Bu token'ı kopyala. Swagger’da **Authorize** → Value kutusuna yapıştır → Authorize.

---

## 3. Kategoriler (başta boş olabilir)

| Adım | Değer |
|------|--------|
| **Method** | GET |
| **URL** | `/api/Category` |

**Beklenen:** 200 OK, `[]` veya mevcut kategoriler. Kategoriler henüz işlem eklenmediği için boş olabilir.

---

## 4. Manuel işlem ekle (kategori otomatik oluşur)

| Adım | Değer |
|------|--------|
| **Method** | POST |
| **URL** | `/api/Transaction/add-manual` |
| **Body (JSON)** | |

```json
{
  "categoryName": "Market",
  "amount": 350.50,
  "isIncome": false,
  "description": "Haftalık market"
}
```

**Beklenen:** 200 OK.  
**Sonuç:** "Market" kategorisi yoksa oluşturulur, işlem kaydedilir.

---

## 5. AI ile işlem ekle

| Adım | Değer |
|------|--------|
| **Method** | POST |
| **URL** | `/api/AI/add-transaction-with-ai` |
| **Body (JSON)** | |

```json
{
  "description": "Migros market alışverişi",
  "amount": 120.00
}
```

**Beklenen:** 200 OK. Cevapta `categoryName`, `categoryId`, `isIncome`, `amount`, `source` (OpenAI veya Keyword) olmalı.

---

## 6. Tekrar AI işlem (gelir örneği)

| Adım | Değer |
|------|--------|
| **Method** | POST |
| **URL** | `/api/AI/add-transaction-with-ai` |
| **Body (JSON)** | |

```json
{
  "description": "Aylık maaş ödemesi",
  "amount": 15000.00
}
```

**Beklenen:** 200 OK, `isIncome: true`, kategori örn. "Maaş".

---

## 7. Kategorileri listele

| Adım | Değer |
|------|--------|
| **Method** | GET |
| **URL** | `/api/Category` |

**Beklenen:** 200 OK, en az Market ve Maaş (ve AI’ın oluşturduğu diğerleri) görünmeli.

---

## 8. İşlemleri listele

| Adım | Değer |
|------|--------|
| **Method** | GET |
| **URL** | `/api/Transaction` veya `/api/Transaction?start=2025-01-01&end=2025-12-31` |

**Beklenen:** 200 OK, eklediğin işlemler (Market 350.50, Migros 120, Maaş 15000 vb.).

---

## 9. Finansal özet

| Adım | Değer |
|------|--------|
| **Method** | GET |
| **URL** | `/api/Analysis/summary` |

**Beklenen:** 200 OK, `totalIncome`, `totalExpense`, `balance`.

---

## 10. Bütçe önerisi (ML)

| Adım | Değer |
|------|--------|
| **Method** | GET |
| **URL** | `/api/Analysis/budget-suggestions?lastMonths=6` |

**Beklenen:** 200 OK, `suggestions[]` (categoryName, suggestedAmount, suggestedByML), `monthsAnalyzed`.

---

## 11. Anomali uyarıları (ML)

| Adım | Değer |
|------|--------|
| **Method** | GET |
| **URL** | `/api/Analysis/anomalies` |

**Beklenen:** 200 OK, `anomalies[]` (bu ay alışılmadık yüksek harcama varsa dolu, yoksa boş liste).

---

## 12. Aylık tahmin (ML)

| Adım | Değer |
|------|--------|
| **Method** | GET |
| **URL** | `/api/Prediction/monthly?month=2025-04-01` |

**Beklenen:** 200 OK, `estimatedAmount`, `predictedMonth`, `message`.

---

## 13. Chatbot

| Adım | Değer |
|------|--------|
| **Method** | POST |
| **URL** | `/api/Chatbot/ask` |
| **Body (JSON)** | |

```json
{
  "message": "Bütçe nasıl yapılır?"
}
```

**Beklenen:** 200 OK, `response` (cevap metni), `source` (OpenAI veya FAQ).

---

## 14. categoryId ile işlem ekle (opsiyonel)

Önce GET `/api/Category` ile bir `categoryId` al (örn. 2). Sonra:

| Adım | Değer |
|------|--------|
| **Method** | POST |
| **URL** | `/api/Transaction/add` |
| **Body (JSON)** | |

```json
{
  "amount": 50.00,
  "description": "Kahve",
  "transactionDate": "2025-02-28",
  "isIncome": false,
  "categoryId": 2
}
```

**Beklenen:** 200 OK. `categoryId` listedeki bir id olmalı.

---

## 15. Fiş yükleme (opsiyonel)

| Adım | Değer |
|------|--------|
| **Method** | POST |
| **URL** | `/api/Receipt/upload` |
| **Body** | form-data, key: `file`, value: fiş görseli (JPEG/PNG) |

**Beklenen:** 200 OK, OCR + kategori + otomatik oluşturulan işlem bilgisi.

---

## Özet kontrol listesi

| # | Ne test edildi | Endpoint |
|---|----------------|----------|
| 1 | Kayıt | POST /api/Auth/register |
| 2 | Giriş + token | POST /api/Auth/login |
| 3 | Kategori listesi | GET /api/Category |
| 4 | Manuel işlem (kategori otomatik) | POST /api/Transaction/add-manual |
| 5–6 | AI işlem (gider + gelir) | POST /api/AI/add-transaction-with-ai |
| 7 | Kategoriler tekrar | GET /api/Category |
| 8 | İşlem listesi | GET /api/Transaction |
| 9 | Finansal özet | GET /api/Analysis/summary |
| 10 | Bütçe önerisi (ML) | GET /api/Analysis/budget-suggestions |
| 11 | Anomali (ML) | GET /api/Analysis/anomalies |
| 12 | Aylık tahmin (ML) | GET /api/Prediction/monthly |
| 13 | Chatbot | POST /api/Chatbot/ask |
| 14 | categoryId ile işlem | POST /api/Transaction/add |
| 15 | Fiş OCR | POST /api/Receipt/upload |

Tüm adımlar 200 (veya beklenen cevap) dönerse test başarılı sayılır.
