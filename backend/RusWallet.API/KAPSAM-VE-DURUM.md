# RusWallet – Kapsam ve Yapılanlar

## Proje kapsamı (hedefler)

| # | Kapsam maddesi | Durum | Nerede / nasıl |
|---|----------------|-------|----------------|
| 1 | **Kullanıcı kimlik doğrulama** (kayıt / giriş) | ✅ Yapıldı | AuthController: Register, Login. JWT token dönüyor. |
| 2 | **Gelir–gider takibi** | ✅ Yapıldı | Transaction: gelir/gider kategorili işlem ekleme ve listeleme (tarih filtresi ile). |
| 3 | **Kategoriler** | ✅ Yapıldı | CategoryController: ekleme, listeleme, silme. Kullanıcıya özel kategoriler. |
| 4 | **İşlemler (transaction)** | ✅ Yapıldı | TransactionController: işlem ekleme, listeleme (start/end), kategori doğrulaması. |
| 5 | **Açıklamadan AI ile kategori önerisi** | ✅ Yapıldı | AIController + KeywordCategoryService. Açıklamaya göre kategori + gelir/gider önerisi (ücretsiz, kelime tabanlı). |
| 6 | **Analiz / özet (ML/istatistik)** | ✅ Yapıldı | AnalysisController: kullanıcının gelir–gider özeti (FinanceAnalysisService, repository). |
| 7 | **Tahmin (predictive analytics)** | ✅ Yapıldı | PredictionController: aylık gider tahmini (son 3 ay ortalaması). |
| 8 | **Chatbot (NLP / sabit sorular)** | ✅ Yapıldı | ChatbotController + FAQChatbotService. Sabit soru–cevap; web/Android/iOS aynı API. |
| 9 | **Veri güvenliği** | ✅ Yapıldı | Şifre BCrypt ile hash; JWT ile yetkilendirme; kullanıcı verisi userId ile ayrılıyor. |
| 10 | **Web + Android + iOS entegrasyonu** | ✅ Hazır | Tüm özellikler tek REST API üzerinden; mobil ve web aynı endpoint’leri kullanır. |

---

## Kapsam dışı / ileride

- **Frontend:** Henüz yok (React / mobil uygulama ayrı geliştirilecek).
- **Gerçek ML modeli:** Tahmin şu an istatistiksel (ortalama); istersen ileride model eğitimi eklenebilir.
- **Ücretli AI (OpenAI vb.):** İsteğe bağlı; şu an ücretsiz kelime/FAQ çözümleri kullanılıyor.

---

## Özet

Kapsamındaki tüm ana maddeler (auth, gelir–gider, kategoriler, işlemler, AI kategori önerisi, analiz, tahmin, chatbot, güvenlik, tek API) backend tarafında tamamlandı. Sıradaki adım: bu API’yi kullanan web ve mobil (Android/iOS) arayüzlerini geliştirmek.
