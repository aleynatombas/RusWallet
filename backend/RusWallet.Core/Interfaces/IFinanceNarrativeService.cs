namespace RusWallet.Core.Interfaces
{
    /// <summary>
    /// Backend'in hesapladığı analiz sonuçlarını doğal dilde açıklar (OpenAI veya kural tabanlı).
    /// Bu servis hiçbir finansal rakam üretmez; rakamlar arayüzde backend alanlarından gösterilir.
    /// </summary>
    public interface IFinanceNarrativeService
    {
        Task<FinanceNarrativeResult> GenerateAsync(FinanceNarrativeRequest request, CancellationToken cancellationToken = default);
    }

    public sealed class FinanceNarrativeRequest
    {
        public ForecastNarrativeFacts? Forecast { get; set; }
        public List<SavingsNarrativeFacts> Savings { get; set; } = new();
        public HabitsNarrativeFacts? Habits { get; set; }
        public TrendNarrativeFacts? Trend { get; set; }
    }

    /// <summary>Bu ayın kategori dağılımından çıkarılan nitel bulgular (AI bunları rakamsız yorumlar).</summary>
    public sealed class HabitsNarrativeFacts
    {
        public string MonthName { get; set; } = "";
        public string TopCategory { get; set; } = "";
        /// <summary>"dominant" (payı en az yüzde kırk) | "leading".</summary>
        public string TopCategoryWeight { get; set; } = "leading";
        /// <summary>Geçen ayın aynı dönemine göre toplam: "up" | "down" | "flat" | null (kıyas yok).</summary>
        public string? TotalDirection { get; set; }
        public List<string> RisingCategories { get; set; } = new();
        public List<string> FallingCategories { get; set; } = new();
        /// <summary>Zorunlu gider payı: "high" | "balanced" | "low".</summary>
        public string FixedShareBand { get; set; } = "balanced";
    }

    /// <summary>Son altı ayın eğiliminden çıkarılan nitel bulgular.</summary>
    public sealed class TrendNarrativeFacts
    {
        /// <summary>Son tamamlanmış ayın gider değişimi: "up" | "down" | "flat" | null.</summary>
        public string? LastMonthDirection { get; set; }
        public string? HighestExpenseMonthName { get; set; }
        public bool IncomeRecorded { get; set; }
        /// <summary>Giderin geliri aştığı tamamlanmış ay sayısı.</summary>
        public int MonthsExpenseAboveIncome { get; set; }
        public int CompleteMonthsWithData { get; set; }
        public int MonthsWithoutData { get; set; }
        /// <summary>Gelecek ay tahmini ortalamaya göre: "above" | "below" | "similar" | null.</summary>
        public string? ForecastVsAverage { get; set; }
    }

    public sealed class ForecastNarrativeFacts
    {
        public string TargetMonthLabel { get; set; } = "";
        public decimal PredictedTotal { get; set; }
        public decimal? LowerBound { get; set; }
        public decimal? UpperBound { get; set; }
        public decimal? LastMonthTotal { get; set; }
        public double? ChangeVsLastMonthPercent { get; set; }
        public decimal RecurringComponent { get; set; }
        public string DataQualityLevel { get; set; } = "";
        public string ModelName { get; set; } = "";
        public List<string> RisingCategories { get; set; } = new();
        public List<string> FallingCategories { get; set; } = new();
    }

    public sealed class SavingsNarrativeFacts
    {
        public string Id { get; set; } = "";
        public string Kind { get; set; } = "";
        public string CategoryName { get; set; } = "";
        public decimal MonthlySaving { get; set; }
        public decimal CurrentLevel { get; set; }
        public decimal TargetLevel { get; set; }
        public List<string> ReasonCodes { get; set; } = new();
        public List<string> SubscriptionNames { get; set; } = new();
    }

    public sealed class FinanceNarrativeResult
    {
        /// <summary>"openai" veya "rule_based".</summary>
        public string Source { get; set; } = "rule_based";
        public string? ForecastCommentary { get; set; }
        public Dictionary<string, SavingsNarrative> Savings { get; set; } = new();
        public string? HabitsCommentary { get; set; }
        public string? TrendCommentary { get; set; }
    }

    public sealed class SavingsNarrative
    {
        public string Title { get; set; } = "";
        public string Explanation { get; set; } = "";
        public string Action { get; set; } = "";
    }
}
