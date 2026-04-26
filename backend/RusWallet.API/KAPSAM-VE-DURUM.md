# RusWallet – Kapsam ve Kullandığım Teknolojiler

## Proje kapsamı (hedefler)

| # | Kapsam maddesi | Durum | Nerede / nasıl |
|---|----------------|-------|----------------|
| 1 | **Kullanıcı kimlik doğrulama** (kayıt / giriş) | ✅ | AuthController: Register, Login. JWT token. |
| 2 | **Gelir–gider takibi** | ✅ | Transaction: işlem ekleme (`POST /api/Transaction/add` — `categoryId` verilmezse varsayılan kategori), AI ile ekleme, listeleme (`GET /api/Transaction`, `period` / tarih filtresi). |
| 3 | **Kategoriler** | ✅ | CategoryController: listeleme (GET), silme (DELETE). Kategori ekleme endpoint’i yok; işlem eklenirken otomatik oluşur. |
| 4 | **İşlem ekleme – Manuel** | ✅ | `POST /api/Transaction/add`: tutar, açıklama, tarih, gelir/gider; isteğe bağlı `categoryId` (0 veya boşta otomatik kategori). |
| 5 | **İşlem ekleme – AI** | ✅ | POST /api/AI/add-transaction-with-ai: açıklama + fiyat; kategori ve gelir/gider otomatik algılanır. |
| 6 | **Açıklamadan kategori önerisi** | ✅ | AIController suggest-category. OpenAI (opsiyonel) veya kelime tabanlı fallback. |
| 7 | **Analiz / özet** | ✅ | AnalysisController: gelir–gider özeti, bütçe önerisi (ML), anomali (ML). |
| 8 | **Tahmin (gelecek ay harcaması)** | ✅ | PredictionController. ML.NET SDCA regresyon + fallback. |
| 9 | **Bütçe önerisi (kategori bazlı)** | ✅ | GET /api/analysis/budget-suggestions. ML.NET regresyon ile öneri. |
| 10 | **Anomali tespiti (alışılmadık harcama)** | ✅ | GET /api/analysis/anomalies. ML.NET Time Series IID Spike + z-score fallback. |
| 11 | **Chatbot** | ✅ | ChatbotController. OpenAI (opsiyonel) veya FAQ (kelime tabanlı). |
| 12 | **Fiş tarama (OCR)** | ✅ | ReceiptController `POST /api/Receipt/upload`: görsel yükleme, Tesseract OCR, satıcı/tarih/tutar çıkarımı, AI ile önerilen kategori. **İşlem kaydı oluşturmaz**; kullanıcı onaylarsa Transaction ile eklenir. |
| 13 | **Veri güvenliği** | ✅ | BCrypt hash, JWT, kullanıcı verisi userId ile ayrı. |
| 14 | **Tek API (web + mobil)** | ✅ | REST API; web ve mobil aynı endpoint’leri kullanır. |

---

## Kullandığım teknolojiler

| Alan | Teknoloji | Açıklama |
|------|-----------|----------|
| **Backend** | .NET 10 / ASP.NET Core | API, middleware, dependency injection. |
| **Veritabanı** | SQL Server + Entity Framework Core 10 | ORM, migrations, DbContext. |
| **Kimlik doğrulama** | JWT Bearer | Token tabanlı yetkilendirme. |
| **Şifre** | BCrypt.Net-Next | Şifre hash. |
| **Machine Learning** | Microsoft.ML 4.0 | Regresyon (SDCA) ile tahmin ve bütçe önerisi. |
| **Zaman serisi / anomali** | Microsoft.ML.TimeSeries 4.0 | IID Spike Detector ile anomali tespiti. |
| **AI (opsiyonel)** | OpenAI API (gpt-4o-mini) | Kategori önerisi, chatbot. ApiKey yoksa fallback. |
| **OCR** | Tesseract 5.2 | Fiş görselinden metin çıkarma. |
| **API dokümantasyonu** | Swagger / OpenAPI | Swashbuckle, JWT tanımlı. |
| **Mimari** | Clean / katmanlı | Core (entities, DTOs, interfaces), Infrastructure (repos, services), API (controllers). |

---

## ML eklenen yerler (kapsam)

| Özellik | Teknoloji | Dosya / servis | Endpoint |
|---------|-----------|----------------|----------|
| **Aylık harcama tahmini** | ML.NET SDCA regresyon | MlNetForecastService, PredictionService | GET /api/prediction/monthly |
| **Bütçe önerisi** | ML.NET SDCA (kategori bazında) | MlNetForecastService, FinanceMLService | GET /api/analysis/budget-suggestions |
| **Anomali tespiti** | ML.NET Time Series IID Spike | MlNetAnomalyService, FinanceMLService | GET /api/analysis/anomalies |

**Yardımcı / fallback:**  
- MLPredictionHelper: linear regression (tahmin fallback), ortalama, standart sapma, z-score.  
- Anomalide ML spike yoksa z-score ≥ 2 ile istatistiksel anomali.

---

## Kapsam dışı / ileride

- **Frontend:** Web ve mobilde giriş + dashboard’da özet ve işlem listesi / ekleme bağlandı; grafikler, fiş yükleme UI, chatbot ekranı vb. genişletilebilir.
- **İşlem güncelleme / silme:** API’de henüz yok; eklenebilir.
- **Refresh token / şifre sıfırlama:** Henüz yok.

---

## Özet

Backend: auth, gelir–gider, kategoriler, AI/OpenAI (opsiyonel), ML tahmin/bütçe/anomali, chatbot, fiş OCR, JWT, tek REST API. Teknoloji özeti: .NET 10, EF Core, SQL Server, ML.NET, ML.NET.TimeSeries, OpenAI, Tesseract, Swagger, BCrypt.
