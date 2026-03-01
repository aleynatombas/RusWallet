# RusWallet – Yapay Zeka ve Chatbot (Öğrenci Bütçesi)

## Nasıl tasarlandı?

- **Bütçe:** Ücretsiz, dış API yok. Hem chatbot hem kategori önerisi kendi sunucunda çalışıyor.
- **Sabit sorular:** Chatbot cevapları FAQ (sık sorulan sorular) listesinden; yeni soru eklemek için sadece `FAQChatbotService.cs` içindeki listeyi güncelliyorsun.
- **Tek API:** Web, Android ve iOS aynı backend’i kullanır; farklı platform için ekstra servis yok.

---

## 1. Chatbot (sabit soru–cevap)

| Özellik        | Açıklama |
|----------------|----------|
| **Endpoint**   | `POST /api/Chatbot/ask` |
| **Yetki**      | JWT (Authorization: Bearer \<token\>) |
| **Body**       | `{ "message": "Bütçe nasıl yapılır?" }` |
| **Cevap**      | `{ "response": "Bütçe yapmak için: ..." }` |

Kullanıcı mesajı, `FAQChatbotService` içindeki anahtar kelimelerle eşleştirilir; eşleşen cevap döner. Eşleşme yoksa “Şunları sorabilirsiniz: ...” ile yönlendirme metni verilir.

**Yeni sabit soru eklemek:** `RusWallet.Infrastructure/Services/FAQChatbotService.cs` → `FixedQA` dizisine yeni `(Keywords, Answer)` ekle.

---

## 2. Kategori önerisi (AI)

| Özellik        | Açıklama |
|----------------|----------|
| **Endpoint**   | `POST /api/AI/suggest-category` |
| **Yetki**      | JWT |
| **Body**       | `{ "description": "Migros market alışverişi" }` |
| **Cevap**      | `{ "predictedCategoryName": "Market", "isIncome": false }` |

Açıklamadaki kelimelere göre öneri yapılır (örn. "muz aldım" → Market, "maaş" → Maaş). Ücretsiz; dış API kullanılmıyor.

**Hazır veri seti:** `RusWallet.API/Data/category-keywords.json` — Her kategori için onlarca anahtar kelime (muz, çilek, elma, meyve, sebze, süt, migros, bim, …) hazır. İstediğin kelimeleri bu dosyaya ekleyebilir veya kategorileri genişletebilirsin; uygulama başlarken bu dosyayı yükler.

**İnternette hazır veri seti:** Hugging Face’ta [mitulshah/transaction-categorization](https://huggingface.co/datasets/mitulshah/transaction-categorization) — 4.5M+ işlem, 10 kategori, `categories.json` içinde kategori–anahtar kelime tanımları var. Hesap açıp indirebilirsin; `categories.json` yapısını projedeki `category-keywords.json` formatına (category, isIncome, keywords) dönüştürüp aynı dosyayı kullanabilirsin.

---

## 3. Mobil ve web entegrasyonu

Tüm istemciler (Android, iOS, web) aynı base URL’e istek atar:

- **Chatbot:** `POST {baseUrl}/api/Chatbot/ask`  
  Header: `Authorization: Bearer <jwt>`  
  Body: `{"message":"..."}`
- **Kategori önerisi:** `POST {baseUrl}/api/AI/suggest-category`  
  Header: `Authorization: Bearer <jwt>`  
  Body: `{"description":"..."}`

Önce `POST /api/Auth/login` ile token alınır; bu token tüm korumalı endpoint’lerde kullanılır.

---

## 4. Bitirme projesi raporu için

- **Chatbot:** “Doğal dil işleme (NLP) ile sık sorulan sorulara cevap veren asistan” veya “kural tabanlı dialog sistemi” olarak anlatılabilir.
- **Kategori önerisi:** “İşlem açıklamasına göre otomatik kategori öneren yapay zeka modülü” (kelime tabanlı / kural tabanlı).
- İleride ücretli bir API (OpenAI, vb.) eklenirse aynı endpoint’ler kullanılabilir; sadece servis implementasyonu değişir.
