using System.Text.Json;
using RusWallet.Core.Interfaces;

namespace RusWallet.Infrastructure.Services
{
    /// <summary>
    /// Soru-cevap chatbot. Tüm kurallar Data/chatbot-faq.json dosyasından okunur. Ücretsiz, dış API yok.
    /// </summary>
    public class FAQChatbotService : IChatbotService
    {
        private const string DefaultAnswer =
            "Bu konuda hazır bir cevabım yok. Şunları sorabilirsiniz: Bütçe nasıl yapılır? Yatırım yapmak istiyorum. Borç nasıl yönetilir? Tasarruf, emeklilik, acil fon, vergi, sigorta, kategori veya işlem ekleme hakkında da soru sorabilirsiniz.";

        private readonly Lazy<List<(string[] Keywords, string Answer)>> _allRules = new(LoadAllRules);

        private static List<(string[] Keywords, string Answer)> LoadAllRules()
        {
            var list = new List<(string[] Keywords, string Answer)>();
            try
            {
                var path = Path.Combine(AppContext.BaseDirectory, "Data", "chatbot-faq.json");
                if (File.Exists(path))
                {
                    var json = File.ReadAllText(path);
                    var opt = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var entries = JsonSerializer.Deserialize<List<ChatbotFaqEntry>>(json, opt);
                    if (entries != null)
                    {
                        foreach (var e in entries.Where(x => x.Keywords?.Length > 0 && !string.IsNullOrWhiteSpace(x.Answer)))
                            list.Add((e.Keywords!, e.Answer!.Trim()));
                    }
                }
            }
            catch { /* dosya yoksa veya hatalıysa boş liste; eşleşmeyen sorular DefaultAnswer döner */ }
            return list;
        }

        public Task<string> AskAsync(string message)
        {
            if (string.IsNullOrWhiteSpace(message))
                return Task.FromResult("Lütfen bir soru yazın.");

            var lower = message.Trim().ToLowerInvariant();

            foreach (var (keywords, answer) in _allRules.Value)
            {
                foreach (var kw in keywords)
                {
                    if (string.IsNullOrEmpty(kw)) continue;
                    if (lower.Contains(kw.Trim().ToLowerInvariant()))
                        return Task.FromResult(answer);
                }
            }

            return Task.FromResult(DefaultAnswer);
        }

        private class ChatbotFaqEntry
        {
            public string[]? Keywords { get; set; }
            public string? Answer { get; set; }
        }
    }
}
