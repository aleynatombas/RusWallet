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
    }

    public sealed class SavingsNarrative
    {
        public string Title { get; set; } = "";
        public string Explanation { get; set; } = "";
        public string Action { get; set; } = "";
    }
}
