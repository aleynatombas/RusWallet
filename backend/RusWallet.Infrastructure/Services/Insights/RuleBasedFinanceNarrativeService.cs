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

        if (request.Habits is { } h)
            result.HabitsCommentary = HabitsText(h);
        if (request.Trend is { } t)
            result.TrendCommentary = TrendText(t);

        return Task.FromResult(result);
    }

    private static string HabitsText(HabitsNarrativeFacts h)
    {
        var top = h.TopCategoryWeight == "dominant"
            ? $"Bu ay harcamanın önemli bir kısmı {h.TopCategory} kategorisinde."
            : $"Bu ay en çok {h.TopCategory} kategorisine harcadın.";
        var change = h.TotalDirection switch
        {
            "up" when h.RisingCategories.Count > 0 =>
                $" Geçen ayın aynı dönemine göre toplam gider arttı; artış en çok {string.Join(" ve ", h.RisingCategories.Take(2))} tarafında.",
            "up" => " Geçen ayın aynı dönemine göre toplam gider arttı.",
            "down" => " Geçen ayın aynı dönemine göre daha az harcıyorsun, bu tempoyu korumak iyi olur.",
            "flat" => " Toplam gider geçen ayın aynı dönemiyle benzer.",
            _ => "",
        };
        var fixedNote = h.FixedShareBand switch
        {
            "high" => " Giderlerin çoğu zorunlu kalemlerde; tasarruf için önce fatura ve aboneliklere bak.",
            "low" => " İsteğe bağlı harcamaların payı yüksek; küçük limitlerle kolayca tasarruf edebilirsin.",
            _ => "",
        };
        return top + change + fixedNote;
    }

    private static string TrendText(TrendNarrativeFacts t)
    {
        var parts = new List<string>();
        parts.Add(t.LastMonthDirection switch
        {
            "up" => "Geçen ay giderlerin bir önceki aya göre arttı.",
            "down" => "Geçen ay giderlerin bir önceki aya göre azaldı.",
            "flat" => "Son iki ayda giderlerin benzer seviyede.",
            _ => "Aylık giderlerin grafikte görünüyor.",
        });
        if (!t.IncomeRecorded)
            parts.Add("Gelirlerini de kaydedersen gelir ve gider dengesini birlikte görebilirsin.");
        else if (t.MonthsExpenseAboveIncome > 0)
            parts.Add(t.MonthsExpenseAboveIncome == t.CompleteMonthsWithData
                ? "Kayıtlı aylarda gider gelirin üzerinde kaldı; bütçeni gözden geçirmen faydalı olur."
                : "Bazı aylarda gider gelirin üzerine çıktı.");
        else
            parts.Add("Kayıtlı aylarda gelirin giderini karşıladı.");
        if (t.ForecastVsAverage == "above")
            parts.Add("Gelecek ay için tahmin ortalamanın üzerinde.");
        else if (t.ForecastVsAverage == "below")
            parts.Add("Gelecek ay için tahmin ortalamanın altında.");
        return string.Join(" ", parts);
    }
}
