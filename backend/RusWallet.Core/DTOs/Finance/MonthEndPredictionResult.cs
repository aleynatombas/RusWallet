namespace RusWallet.Core.DTOs.Finance;

/// <summary>Bu ay harcamasına dayalı gelecek ay tahmini sonucu.</summary>
public sealed class MonthEndPredictionResult
{
    public decimal CurrentMonthSpentMtd { get; set; }
    public int CurrentMonthDay { get; set; }
    public int DaysInMonth { get; set; }
    public decimal DailyAverageSpend { get; set; }
    public decimal ProjectedMonthTotal { get; set; }
    public decimal? ForecastNextMonthTotal { get; set; }
    public string ForecastExplanation { get; set; } = "";
    public string ForecastDisclaimer { get; set; } =
        "Bu bir öngörüdür; harcama hızın değişirse rakam güncellenir. Kesin fatura tutarı değildir.";
    public string PredictionSource { get; set; } = "ml_linear";
    public int PredictionConfidencePercent { get; set; }

    public int BudgetFillPercent { get; set; }
    public bool IsOverPaceVersusDisposable { get; set; }
    public bool ProjectedUsesFixedPlusFlexibleSplit { get; set; }
    public bool HasDisposableReference { get; set; }
}
