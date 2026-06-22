using RusWallet.Core.DTOs.Finance;

namespace RusWallet.Core.Interfaces;

/// <summary>Ay sonu kokpit kartı için kısa koçluk mesajı (OpenAI veya kural tabanlı fallback).</summary>
public interface ICockpitMonthEndInsightService
{
    Task<string> GenerateShortMessageAsync(MonthEndInsightContext context, CancellationToken cancellationToken = default);
}

/// <summary>AI/kural motoruna giden özet bağlam.</summary>
public sealed class MonthEndInsightContext
{
    public decimal ProjectedMonthTotal { get; set; }
    public decimal? ForecastNextMonthTotal { get; set; }
    public int DaysRemainingInMonth { get; set; }
    public int BudgetFillPercent { get; set; }
    public bool IsOverPaceVersusDisposable { get; set; }
    public bool HasDisposableReference { get; set; }
    public bool ProjectedUsesFixedPlusFlexibleSplit { get; set; }
    public string PredictionSource { get; set; } = "";
    public int PredictionConfidencePercent { get; set; }
}
