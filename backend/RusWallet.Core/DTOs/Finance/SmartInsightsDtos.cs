namespace RusWallet.Core.DTOs.Finance
{
    /// <summary>GET /api/Analysis/insights — Analizlerim sol sütunundaki üç modül.</summary>
    public class SmartInsightsResponseDto
    {
        public DateTime GeneratedAtUtc { get; set; }
        public ForecastInsightDto Forecast { get; set; } = new();
        public AnomalyInsightDto Anomalies { get; set; } = new();
        public SavingsInsightDto Savings { get; set; } = new();
        /// <summary>Doğal dil açıklamalarının kaynağı: "openai" veya "rule_based".</summary>
        public string NarrativeSource { get; set; } = "rule_based";
    }

    /// <summary>Modelin dayandığı veri miktarı. Level: "insufficient" | "limited" | "good".</summary>
    public class DataSufficiencyDto
    {
        public string Level { get; set; } = "insufficient";
        public int HistoryDays { get; set; }
        public int ExpenseTransactionCount { get; set; }
        public int CompleteMonths { get; set; }
        public int RequiredHistoryDays { get; set; }
        public int RequiredTransactions { get; set; }
        public string Message { get; set; } = "";
    }

    // ── 1. Gelecek ay tahmini ──────────────────────────────────────────────

    public class ForecastInsightDto
    {
        /// <summary>"ready" | "insufficient_data" | "error".</summary>
        public string Status { get; set; } = "insufficient_data";
        public DataSufficiencyDto DataQuality { get; set; } = new();
        public string TargetMonthLabel { get; set; } = "";
        public int TargetYear { get; set; }
        public int TargetMonth { get; set; }

        public decimal? PredictedTotal { get; set; }
        /// <summary>%90 tahmin aralığı alt sınırı.</summary>
        public decimal? LowerBound { get; set; }
        public decimal? UpperBound { get; set; }
        /// <summary>Tespit edilen düzenli ödemelerden gelen kısım (kira, abonelik…).</summary>
        public decimal RecurringComponent { get; set; }
        /// <summary>Değişken harcamaların zaman serisi modeli ile tahmini.</summary>
        public decimal VariableComponent { get; set; }

        public decimal? LastMonthTotal { get; set; }
        public double? ChangeVsLastMonthPercent { get; set; }
        public decimal CurrentMonthActualToDate { get; set; }
        public decimal? CurrentMonthProjectedTotal { get; set; }

        /// <summary>"ssa" (ML.NET Singular Spectrum Analysis) veya "seasonal_baseline".</summary>
        public string Method { get; set; } = "";
        public string ModelName { get; set; } = "";
        public ForecastBacktestDto? Backtest { get; set; }

        public List<ForecastSeriesPointDto> Series { get; set; } = new();
        public List<CategoryDriverDto> CategoryDrivers { get; set; } = new();
        public List<RecurringPaymentDto> RecurringPayments { get; set; } = new();

        public string? AiCommentary { get; set; }
        /// <summary>"openai" veya "rule_based" (AI metni rakam içerirse reddedilir ve kural tabanlı metin kullanılır).</summary>
        public string AiCommentarySource { get; set; } = "rule_based";
        public string Message { get; set; } = "";
    }

    /// <summary>Son 28 günü saklayıp modeli geçmiş üzerinde sınama sonucu.</summary>
    public class ForecastBacktestDto
    {
        public int HoldoutDays { get; set; }
        public decimal ActualTotal { get; set; }
        public decimal? SsaPredictedTotal { get; set; }
        public double? SsaErrorPercent { get; set; }
        public decimal BaselinePredictedTotal { get; set; }
        public double BaselineErrorPercent { get; set; }
        public string SelectedModel { get; set; } = "";
    }

    public class ForecastSeriesPointDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public string Label { get; set; } = "";
        /// <summary>Gerçekleşen toplam (geçmiş aylar ve bu ayın bugüne kadarki kısmı).</summary>
        public decimal? Actual { get; set; }
        /// <summary>Model tahmini (bu ay sonu ve gelecek ay).</summary>
        public decimal? Forecast { get; set; }
        public decimal? Lower { get; set; }
        public decimal? Upper { get; set; }
        /// <summary>"complete" | "current" | "forecast".</summary>
        public string Kind { get; set; } = "complete";
    }

    public class CategoryDriverDto
    {
        public string CategoryName { get; set; } = "";
        public decimal Last3MonthAverage { get; set; }
        /// <summary>Son 3 ay ortalamasının önceki 3 aya göre değişimi.</summary>
        public double? TrendPercent { get; set; }
        public double SharePercent { get; set; }
    }

    public class RecurringPaymentDto
    {
        public string Name { get; set; } = "";
        public string CategoryName { get; set; } = "";
        public decimal ExpectedAmount { get; set; }
        public int TypicalDayOfMonth { get; set; }
        public int MonthsObserved { get; set; }
        public bool IsSubscription { get; set; }
    }

    // ── 2. Anomali tespiti ─────────────────────────────────────────────────

    public class AnomalyInsightDto
    {
        public string Status { get; set; } = "insufficient_data";
        public DataSufficiencyDto DataQuality { get; set; } = new();
        public List<AnomalyItemDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public string? TopCategoryName { get; set; }
        public int EvaluatedWindowDays { get; set; }
        public int EvaluatedTransactionCount { get; set; }
        /// <summary>Düzenli ödeme olduğu için değerlendirme dışında tutulan işlem sayısı.</summary>
        public int ExcludedRecurringCount { get; set; }
        public int DismissedCount { get; set; }
        public string ModelName { get; set; } = "";
        public string Message { get; set; } = "";
    }

    public class AnomalyItemDto
    {
        /// <summary>"Normal olarak işaretle" için kullanılan anahtar.</summary>
        public string Key { get; set; } = "";
        /// <summary>"unusual_transaction" | "category_spike" | "frequency_spike".</summary>
        public string Type { get; set; } = "";
        /// <summary>"high" | "medium".</summary>
        public string Severity { get; set; } = "medium";
        public string CategoryName { get; set; } = "";
        public int? CategoryId { get; set; }
        public int? TransactionId { get; set; }
        public string? Description { get; set; }
        public DateTime? Date { get; set; }
        public decimal CurrentAmount { get; set; }
        public decimal NormalAmount { get; set; }
        public double DeviationPercent { get; set; }
        public int? CurrentCount { get; set; }
        public double? NormalCount { get; set; }
        public string Reason { get; set; } = "";
        public string Explanation { get; set; } = "";
        /// <summary>0–1; eğitim verisindeki skorların yüzdelik dilimi (yüksek = daha sıra dışı).</summary>
        public double? AnomalyScore { get; set; }
        public List<string> DetectionMethods { get; set; } = new();
    }

    // ── 3. Tasarruf fırsatları ─────────────────────────────────────────────

    public class SavingsInsightDto
    {
        public string Status { get; set; } = "insufficient_data";
        public DataSufficiencyDto DataQuality { get; set; } = new();
        public decimal TotalMonthlyPotential { get; set; }
        public decimal TotalYearlyPotential { get; set; }
        public decimal MonthlySubscriptionTotal { get; set; }
        public List<SavingsOpportunityDto> Opportunities { get; set; } = new();
        public string Message { get; set; } = "";
    }

    public class SavingsOpportunityDto
    {
        public string Id { get; set; } = "";
        /// <summary>"category_reduction" | "subscription_price_increase" | "overlapping_subscriptions".</summary>
        public string Kind { get; set; } = "";
        public string CategoryName { get; set; } = "";
        public decimal MonthlySaving { get; set; }
        public decimal YearlySaving { get; set; }
        /// <summary>Gelecek ay beklenen harcama (ML tahmini veya son 3 ay).</summary>
        public decimal CurrentLevel { get; set; }
        /// <summary>Hedef seviye (kullanıcının kendi tipik ayı).</summary>
        public decimal TargetLevel { get; set; }
        /// <summary>"high" | "medium" | "low".</summary>
        public string Confidence { get; set; } = "medium";
        public double PriorityScore { get; set; }
        public List<string> ReasonCodes { get; set; } = new();
        public List<string> Reasons { get; set; } = new();
        public List<MonthAmountDto> MonthlyHistory { get; set; } = new();
        public List<RecurringPaymentDto> RelatedSubscriptions { get; set; } = new();
        public string Title { get; set; } = "";
        public string Explanation { get; set; } = "";
        public string Action { get; set; } = "";
        /// <summary>Başlık/açıklama kaynağı: "openai" veya "rule_based".</summary>
        public string NarrativeSource { get; set; } = "rule_based";
        public bool UsedMlForecast { get; set; }
    }

    public class MonthAmountDto
    {
        public string Label { get; set; } = "";
        public decimal Amount { get; set; }
    }
}
