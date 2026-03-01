using System.Text.Json;
using RusWallet.Core.DTOs.AI;
using RusWallet.Core.Interfaces;

namespace RusWallet.Infrastructure.Services
{
    /// <summary>
    /// Açıklamadaki kelimelere göre ücretsiz kategori önerisi. Hazır veri seti: Data/category-keywords.json (muz, çilek, market vb.).
    /// Dosya yoksa veya hata varsa gömülü varsayılan liste kullanılır.
    /// </summary>
    public class KeywordCategoryService : IAIService
    {
        private readonly Lazy<List<CategoryKeywordRule>> _rules;

        public KeywordCategoryService()
        {
            _rules = new Lazy<List<CategoryKeywordRule>>(LoadRules);
        }

        private static List<CategoryKeywordRule> LoadRules()
        {
            try
            {
                var path = Path.Combine(AppContext.BaseDirectory, "Data", "category-keywords.json");
                if (File.Exists(path))
                {
                    var json = File.ReadAllText(path);
                    var opt = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var list = JsonSerializer.Deserialize<List<CategoryKeywordRule>>(json, opt);
                    if (list is { Count: > 0 })
                    {
                        EnsureElektronikAfterMarket(list);
                        return list;
                    }
                }
            }
            catch
            {
                // Fallback to defaults
            }

            return GetDefaultRules();
        }

        /// <summary>"Telefon aldım" → Elektronik, "telefon faturası" → Faturalar olması için Elektronik, Faturalar'dan SONRA eklenir (önce fatura ifadeleri kontrol edilir).</summary>
        private static void EnsureElektronikAfterMarket(List<CategoryKeywordRule> list)
        {
            if (list.Any(r => r.Category.Equals("Elektronik", StringComparison.OrdinalIgnoreCase))) return;
            var elektronik = new CategoryKeywordRule
            {
                Category = "Elektronik",
                IsIncome = false,
                Keywords = new[] { "telefon", "cep telefonu", "iphone", "samsung", "xiaomi", "oppo", "huawei", "bilgisayar", "laptop", "notebook", "tablet", "televizyon", "monitör", "monitor", "kulaklık", "kulaklik", "elektronik", "teknoloji", "gsm", "apple", "android" }
            };
            var faturalarIdx = list.FindIndex(r => r.Category.Equals("Faturalar", StringComparison.OrdinalIgnoreCase));
            list.Insert(faturalarIdx >= 0 ? faturalarIdx + 1 : list.Count, elektronik);
        }

        private static List<CategoryKeywordRule> GetDefaultRules()
        {
            return new List<CategoryKeywordRule>
            {
                new() { Category = "Maaş", IsIncome = true, Keywords = new[] { "maaş", "maas", "ücret", "ucret", "aylık", "aylik" } },
                new() { Category = "Market", IsIncome = false, Keywords = new[] { "market", "meyve", "sebze", "muz", "çilek", "cilek", "süt", "sut", "ekmek", "gıda", "gida", "bakkal", "migros", "bim", "a101", "şok", "sok" } },
                new() { Category = "Ulaşım", IsIncome = false, Keywords = new[] { "benzin", "akaryakıt", "yakıt", "yakit", "petrol", "araç", "arac", "trafik", "otopark" } },
                new() { Category = "Faturalar", IsIncome = false, Keywords = new[] { "elektrik", "su", "doğalgaz", "dogalgaz", "fatura", "internet", "telefon faturası", "telefon faturasi", "tv faturası", "aidat" } },
                new() { Category = "Elektronik", IsIncome = false, Keywords = new[] { "telefon", "cep telefonu", "iphone", "samsung", "bilgisayar", "laptop", "tablet", "televizyon", "elektronik" } },
                new() { Category = "Kira", IsIncome = false, Keywords = new[] { "kira", "ev", "konut" } },
                new() { Category = "Yemek", IsIncome = false, Keywords = new[] { "restoran", "yemek", "kahve", "cafe", "kafe", "fast food", "sipariş", "siparis" } },
                new() { Category = "Giyim", IsIncome = false, Keywords = new[] { "giysi", "ayakkabı", "ayakkabi", "giyim", "kıyafet", "kiyafet" } },
                new() { Category = "Sağlık", IsIncome = false, Keywords = new[] { "eczane", "ilaç", "ilac", "sağlık", "saglik", "doktor", "hastane" } },
                new() { Category = "Gelir", IsIncome = true, Keywords = new[] { "freelance", "serbest", "proje", "danışmanlık", "ödeme", "odeme", "havale", "eft" } },
                new() { Category = "Diğer Gelir", IsIncome = true, Keywords = new[] { "hediye", "bağış", "bagis" } },
            };
        }

        public Task<CategoryPredictionResponseDto> PredictCategoryAsync(string description)
        {
            if (string.IsNullOrWhiteSpace(description))
                return Task.FromResult(new CategoryPredictionResponseDto { PredictedCategoryName = "Diğer", IsIncome = false });

            var lower = description.Trim().ToLowerInvariant();
            foreach (var rule in _rules.Value)
            {
                foreach (var kw in rule.Keywords)
                {
                    if (string.IsNullOrEmpty(kw)) continue;
                    if (lower.Contains(kw.Trim().ToLowerInvariant()))
                        return Task.FromResult(new CategoryPredictionResponseDto { PredictedCategoryName = rule.Category, IsIncome = rule.IsIncome });
                }
            }
            return Task.FromResult(new CategoryPredictionResponseDto { PredictedCategoryName = "Diğer", IsIncome = false });
        }

        private class CategoryKeywordRule
        {
            public string Category { get; set; } = "";
            public bool IsIncome { get; set; }
            public string[] Keywords { get; set; } = Array.Empty<string>();
        }
    }
}
