namespace RusWallet.Core.DTOs.Finance;

/// <summary>Finansal yol haritası: kokpit, yaşam tarzı, nakit akışı, soru modülü.</summary>
public sealed class FinancialRoadmapResponseDto
{
    /// <summary>Eski alan; geriye dönük uyumluluk. Yeni istemciler <see cref="Cockpit"/> kullanır.</summary>
    public List<InsightCardDto> InsightCards { get; set; } = new();

    /// <summary>Analizler «Finansal kokpit»: ay sonu, radar, fırsatlar.</summary>
    public FinancialCockpitDto? Cockpit { get; set; }

    public LifestyleProfileDto? Lifestyle { get; set; }
    public CashFlowOutlookDto CashFlow { get; set; } = new();
    public AnalysisQaModuleDto? QaModule { get; set; }

    /// <summary>Son aylar harcama eğrisi (aynı takvim gününe kadar dilim); sparkline için.</summary>
    public MonthSpendSparklineDto? MonthSpendSparkline { get; set; }
}

/// <summary>Son 6 ay, her ay için bugünle aynı güne kadar toplam gider (kıyaslanabilir dönem).</summary>
public sealed class MonthSpendSparklineDto
{
    public List<MonthSpendSparklinePointDto> Points { get; set; } = new();

    /// <summary>Son ay dilimi, bir önceki ay dilimine göre yüzde farkı; önceki dönem gideri yoksa null.</summary>
    public double? PercentChangeVsPreviousMonth { get; set; }

    /// <summary>Grafik için anlamlı veri var mı (en az bir dönemde gider).</summary>
    public bool HasComparableData { get; set; }
}

public sealed class MonthSpendSparklinePointDto
{
    /// <summary>yyyy-MM</summary>
    public string MonthKey { get; set; } = "";

    /// <summary>Kısa ay adı (örn. Nis).</summary>
    public string ShortLabel { get; set; } = "";

    public decimal TotalExpense { get; set; }
}

/// <summary>Üçlü kokpit kartı (API + web).</summary>
public sealed class FinancialCockpitDto
{
    public MonthEndExpectationCockpitDto MonthEnd { get; set; } = new();
    public RadarHitsCockpitDto Radar { get; set; } = new();
    public OpportunityCornerCockpitDto Opportunities { get; set; } = new();
}

public sealed class MonthEndExpectationCockpitDto
{
    public decimal ProjectedMonthTotal { get; set; }
    public int DaysRemainingInMonth { get; set; }
    /// <summary>0–100: projeksiyon / esnek pay (veya veri yoksa ay ilerlemesi).</summary>
    public int BudgetFillPercent { get; set; }
    public bool IsOverPaceVersusDisposable { get; set; }
    /// <summary>Tanıtımdan esnek pay referansı var mı (UI renk/parlama için).</summary>
    public bool HasDisposableReference { get; set; }
    /// <summary>
    /// true: tahmin = Tanıyalım aylık sabit gider + yalnızca esnek harcama (kira/fatura/abonelik benzeri kategoriler hariç) temposunun ay sonuna ölçeklenmesi.
    /// false: tüm harcama doğrusal ölçeklenir (sabit gider Tanıyalım’da yoksa veya esnek referans yoksa).
    /// </summary>
    public bool ProjectedUsesFixedPlusFlexibleSplit { get; set; }
    public string ShortMessage { get; set; } = "";
    public string? ActionChatMessage { get; set; }

    /// <summary>İstemci etiketi: predictive_analysis (AI + predictive gelecek ay tahmini).</summary>
    public string InsightStack { get; set; } = "predictive_analysis";

    /// <summary>Bir sonraki takvim ayı için toplam gider öngörüsü (predictive: son üç tam ay ortalaması).</summary>
    public decimal? ForecastNextMonthTotal { get; set; }
}

public sealed class RadarHitsCockpitDto
{
    /// <summary>Yeterli geçmiş veri yok; UI iskelet + flu gösterir.</summary>
    public bool IsLowData { get; set; }
    public bool HasUnusualSpending { get; set; }
    public List<RadarHitItemDto> Hits { get; set; } = new();
    /// <summary>Sıradışı yokken bu ayki en büyük harcama kategorisi (boş alanı doldurmak için).</summary>
    public string? TopMonthCategoryLabel { get; set; }
    public decimal? TopMonthCategoryAmount { get; set; }
    public string ShortMessage { get; set; } = "";
    public string? ActionChatMessage { get; set; }

    /// <summary>İstemci etiketi: ml_anomaly (machine learning — sıradışı harcama).</summary>
    public string InsightStack { get; set; } = "ml_anomaly";
}

public sealed class RadarHitItemDto
{
    public string CategoryLabel { get; set; } = "";
    public decimal Amount { get; set; }
    public bool IsUnusual { get; set; } = true;
}

public sealed class OpportunityCornerCockpitDto
{
    /// <summary>Az veri / henüz karo yok: iskelet + kısa mesaj.</summary>
    public bool IsLearning { get; set; }
    public List<OpportunityTileDto> Tiles { get; set; } = new();
    public string ShortMessage { get; set; } = "";
    public string? ActionChatMessage { get; set; }

    /// <summary>İstemci etiketi: ml_opportunity (machine learning — tasarruf sinyalleri).</summary>
    public string InsightStack { get; set; } = "ml_opportunity";
}

public sealed class OpportunityTileDto
{
    public string IconEmoji { get; set; } = "✨";
    public string Label { get; set; } = "";
    public string? Subtitle { get; set; }
    public decimal? EstimatedSaving { get; set; }
}

public sealed class InsightCardDto
{
    public string Id { get; set; } = "";
    /// <summary>savings_potential | anomaly | forecast</summary>
    public string Kind { get; set; } = "";
    public string Title { get; set; } = "";
    /// <summary>Kısa özet / ana rakam satırı.</summary>
    public string Metric { get; set; } = "";
    /// <summary>Neden (açıklama).</summary>
    public string Why { get; set; } = "";
    public string ActionLabel { get; set; } = "";
    public string? ActionChatMessage { get; set; }
    /// <summary>default | warning | positive</summary>
    public string Tone { get; set; } = "default";
}

public sealed class LifestyleProfileDto
{
    /// <summary>0–100: yüksek = daha çok esnek (isteğe bağlı) harcama.</summary>
    public double FlexibilityScore { get; set; }
    public double MandatorySharePercent { get; set; }
    public double DiscretionarySharePercent { get; set; }
    public string Summary { get; set; } = "";
}

public sealed class CashFlowOutlookDto
{
    public List<UpcomingPaymentHintDto> UpcomingHints { get; set; } = new();
    public decimal? PredictedWeekExpenseTotal { get; set; }
    public string? BalanceOutlookMessage { get; set; }
    public CreditLimitGaugeDto? CreditGauge { get; set; }
}

public sealed class UpcomingPaymentHintDto
{
    public string CategoryLabel { get; set; } = "";
    public decimal TypicalMonthlyAmount { get; set; }
    public string BasisNote { get; set; } = "";
}

public sealed class CreditLimitGaugeDto
{
    public bool HasData { get; set; }
    public double? UtilizationPercent { get; set; }
    public string Message { get; set; } = "";
}

public sealed class AnalysisQaModuleDto
{
    public string Question { get; set; } = "";
    public string OptionA { get; set; } = "";
    public string OptionB { get; set; } = "";
    public string ChatMessageA { get; set; } = "";
    public string ChatMessageB { get; set; } = "";
}
