using RusWallet.Core.Interfaces;

namespace RusWallet.Infrastructure.Services.Insights;

/// <summary>OpenAI anahtarı yoksa veya hata olursa kullanılan şablon açıklamalar. Rakam içermez; rakamlar arayüzde ayrı gösterilir.</summary>
public sealed class RuleBasedFinanceNarrativeService : IFinanceNarrativeService
{
    public Task<FinanceNarrativeResult> GenerateAsync(FinanceNarrativeRequest request, CancellationToken cancellationToken = default)
    {
        var result = new FinanceNarrativeResult { Source = "rule_based" };

        if (request.Forecast is { } f)
        {
            var dir = f.ChangeVsLastMonthPercent switch
            {
                > 5 => "Gelecek ay harcamanın geçen aydan yüksek olması bekleniyor",
                < -5 => "Gelecek ay harcamanın geçen aydan düşük olması bekleniyor",
                _ => "Gelecek ay harcamanın geçen ayla benzer seyretmesi bekleniyor",
            };
            var driver = f.RisingCategories.Count > 0
                ? $"; artışın ana kaynağı {string.Join(" ve ", f.RisingCategories.Take(2))}."
                : ".";
            var tip = f.RecurringComponent > 0
                ? " Düzenli ödemeler sabit kalacağı için değişken harcamaları izlemen en etkili adım."
                : "";
            result.ForecastCommentary = dir + driver + tip;
        }

        foreach (var s in request.Savings)
        {
            result.Savings[s.Id] = s.Kind switch
            {
                "subscription_price_increase" => new SavingsNarrative
                {
                    Title = $"{s.CategoryName}: abonelik fiyatı arttı",
                    Explanation = "Düzenli ödemenin tutarı ilk ödemelere göre yükselmiş.",
                    Action = "Daha uygun bir pakete geçmeyi veya kampanya tekliflerini değerlendir.",
                },
                "overlapping_subscriptions" => new SavingsNarrative
                {
                    Title = $"{s.CategoryName}: çakışan abonelikler",
                    Explanation = "Aynı kategoride birden fazla düzenli abonelik ödemesi görünüyor.",
                    Action = "Az kullandığın aboneliği iptal etmeyi veya dönüşümlü kullanmayı düşün.",
                },
                _ => new SavingsNarrative
                {
                    Title = $"{s.CategoryName} harcamasını tipik seviyene çek",
                    Explanation = s.ReasonCodes.Contains("trend_up")
                        ? "Bu kategoride harcama son aylarda yükseliş eğiliminde."
                        : s.ReasonCodes.Contains("above_typical")
                            ? "Son ay bu kategoride tipik ayından fazla harcadın."
                            : "Bu kategoride daha düşük harcadığın aylar var; o seviye ulaşılabilir bir hedef.",
                    Action = "Bu kategori için haftalık bir limit belirleyip harcamaları hafta hafta takip et.",
                },
            };
        }

        return Task.FromResult(result);
    }
}
