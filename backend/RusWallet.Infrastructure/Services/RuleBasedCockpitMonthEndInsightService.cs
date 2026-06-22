using RusWallet.Core.DTOs.Finance;
using RusWallet.Core.Interfaces;

namespace RusWallet.Infrastructure.Services;

/// <summary>OpenAI yoksa veya hata olursa kullanılan kural tabanlı kısa mesaj.</summary>
public sealed class RuleBasedCockpitMonthEndInsightService : ICockpitMonthEndInsightService
{
    public Task<string> GenerateShortMessageAsync(MonthEndInsightContext context, CancellationToken cancellationToken = default)
    {
        var over = context.IsOverPaceVersusDisposable;
        var split = context.ProjectedUsesFixedPlusFlexibleSplit;
        var days = context.DaysRemainingInMonth;

        string message;
        if (!context.HasDisposableReference)
        {
            message = context.PredictionConfidencePercent >= 60
                ? $"ML tahminine göre bu ay toplam giderin yaklaşık {context.ProjectedMonthTotal:N0} ₺ seviyesinde bitebilir."
                : "Daha fazla işlem kaydı eklendikçe ay sonu tahmini daha isabetli hale gelir.";
        }
        else if (over)
        {
            message = split
                ? $"Mevcut esnek harcama tempon ML projeksiyonuna göre ay sonu esnek payını zorlayabilir; kalan {days} günde tempo düşürülmesi önerilir."
                : $"Mevcut harcama tempon ML projeksiyonuna göre ay sonu bütçeni zorlayabilir; kalan {days} günde harcamayı sıkılaştırmayı düşün.";
        }
        else
        {
            message = split
                ? "Mevcut esnek harcama tempon ML tahminine göre ay sonu bütçeni koruyabilir; büyük sabit giderleri gözden geçirmek hâlâ faydalı olur."
                : "Mevcut harcama tempon ML tahminine göre ay sonu bütçeni koruyabilir.";
        }

        if (context.ForecastNextMonthTotal is > 0 && context.PredictionConfidencePercent >= 55)
        {
            message += $" Gelecek ay için öngörü: yaklaşık {context.ForecastNextMonthTotal:N0} ₺.";
        }

        return Task.FromResult(message);
    }
}
