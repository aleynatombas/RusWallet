using System.Globalization;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using RusWallet.Core.DTOs.Finance;
using RusWallet.Core.Interfaces;

namespace RusWallet.Infrastructure.Services.Insights;

/// <summary>
/// Analizlerim sol sütunu için üç modülü (tahmin, anomali, tasarruf) tek istekte hesaplar.
/// Sonuç, kullanıcının işlem verisinin parmak izine göre önbelleğe alınır: veri değişmedikçe
/// modeller yeniden eğitilmez ve OpenAI tekrar çağrılmaz.
/// </summary>
public sealed partial class SmartInsightsService : ISmartInsightsService
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(6);

    private readonly ITransactionRepository _transactions;
    private readonly ICategoryRepository _categories;
    private readonly IAnomalyFeedbackRepository _feedback;
    private readonly IFinanceNarrativeService _narrative;
    private readonly RuleBasedFinanceNarrativeService _ruleNarrative;
    private readonly IMemoryCache _cache;
    private readonly ILogger<SmartInsightsService> _logger;

    public SmartInsightsService(
        ITransactionRepository transactions,
        ICategoryRepository categories,
        IAnomalyFeedbackRepository feedback,
        IFinanceNarrativeService narrative,
        RuleBasedFinanceNarrativeService ruleNarrative,
        IMemoryCache cache,
        ILogger<SmartInsightsService> logger)
    {
        _transactions = transactions;
        _categories = categories;
        _feedback = feedback;
        _narrative = narrative;
        _ruleNarrative = ruleNarrative;
        _cache = cache;
        _logger = logger;
    }

    public async Task<SmartInsightsResponseDto> GetInsightsAsync(int userId, CancellationToken cancellationToken = default)
    {
        var today = DateTime.Today;
        var raw = await _transactions.GetByUserAndDateRangeAsync(userId, today.AddDays(-400), today.AddDays(1), isIncome: false);
        var expenses = raw.Where(t => t.Amount > 0).Select(ExpenseRecord.From).OrderBy(e => e.Date).ToList();
        // Gelirler yalnızca 6 aylık trend kartı için gerekir.
        var trendStart = new DateTime(today.Year, today.Month, 1).AddMonths(-(FinancialTrendEngine.MonthsShown - 1));
        var rawIncome = await _transactions.GetByUserAndDateRangeAsync(userId, trendStart, today.AddDays(1), isIncome: true);
        var incomes = rawIncome.Where(t => t.Amount > 0).Select(ExpenseRecord.From).OrderBy(e => e.Date).ToList();

        var fingerprint = string.Join('|',
            today.ToString("yyyyMMdd", CultureInfo.InvariantCulture),
            expenses.Count,
            expenses.Count == 0 ? 0 : expenses.Max(e => e.TransactionId),
            expenses.Sum(e => e.Amount).ToString(CultureInfo.InvariantCulture),
            expenses.Aggregate(17, (h, e) => HashCode.Combine(h, e.CategoryId, e.Date, e.Description)),
            incomes.Count,
            incomes.Sum(e => e.Amount).ToString(CultureInfo.InvariantCulture),
            incomes.Aggregate(17, (h, e) => HashCode.Combine(h, e.TransactionId, e.Date)));
        var cacheKey = $"smart-insights:{userId}:{fingerprint}";

        if (!_cache.TryGetValue(cacheKey, out SmartInsightsResponseDto? computed) || computed == null)
        {
            computed = await ComputeAsync(expenses, incomes, today, cancellationToken);
            _cache.Set(cacheKey, computed, CacheDuration);
        }

        var dismissed = await _feedback.GetKeysAsync(userId);
        return ApplyDismissals(computed, dismissed);
    }

    private async Task<SmartInsightsResponseDto> ComputeAsync(
        List<ExpenseRecord> expenses, List<ExpenseRecord> incomes, DateTime today, CancellationToken ct)
    {
        var recurring = RecurringPaymentDetector.Detect(expenses, today);

        // Önce anomali: tek seferlik uç işlemler tahmin ve tasarruf hesabını şişirmesin diye o modüllerden çıkarılır.
        var anomalies = Safe(() => AnomalyDetectionEngine.Detect(expenses, recurring, new HashSet<string>(), today), "anomalies",
            () => new AnomalyInsightDto { Status = "error", Message = "Anomali analizi şu an yapılamadı." });
        var outlierIds = anomalies.Items
            .Where(i => i.Type == "unusual_transaction" && i.TransactionId.HasValue)
            .Select(i => i.TransactionId!.Value)
            .ToHashSet();
        var robustExpenses = outlierIds.Count == 0 ? expenses : expenses.Where(e => !outlierIds.Contains(e.TransactionId)).ToList();

        var forecast = Safe(() => SpendingForecastEngine.Build(robustExpenses, recurring, today), "forecast",
            () => new ForecastInsightDto { Status = "error", Message = "Tahmin şu an hesaplanamadı." });
        var savings = Safe(() => SavingsOpportunityEngine.Build(robustExpenses, recurring, today), "savings",
            () => new SavingsInsightDto { Status = "error", Message = "Tasarruf analizi şu an yapılamadı." });
        if (outlierIds.Count > 0 && forecast.Status == "ready")
        {
            // Gerçekleşen tutarlar (grafik, geçen ay, bu ay) uç işlemler dahil gösterilir; yalnızca model girdisinden çıkarıldılar.
            SpendingForecastEngine.RestoreActuals(forecast, expenses, today);
            forecast.Message += $" Tek seferlik {outlierIds.Count} uç işlem model girdisinden çıkarıldı.";
        }

        // Sağ sütun kartları gerçekleşen tutarları gösterir (uç işlemler dahil); tahmin, sol kartla aynı sayıdır.
        var habits = Safe(() => SpendingHabitsEngine.Build(expenses, today), "habits",
            () => new SpendingHabitsInsightDto { Status = "error", Message = "Harcama dağılımı şu an hesaplanamadı." });
        var trend = Safe(() => FinancialTrendEngine.Build(expenses, incomes, forecast, today), "trend",
            () => new FinancialTrendInsightDto { Status = "error", Message = "Finansal trend şu an hesaplanamadı." });

        var request = BuildNarrativeRequest(forecast, savings, habits, trend);
        var narrativeSource = "rule_based";
        if (request.Forecast != null || request.Savings.Count > 0 || request.Habits != null || request.Trend != null)
        {
            FinanceNarrativeResult ai;
            try
            {
                ai = await _narrative.GenerateAsync(request, ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Finans açıklaması üretilemedi; kural tabanlı metne düşülüyor.");
                ai = new FinanceNarrativeResult();
            }
            var rules = await _ruleNarrative.GenerateAsync(request, ct);
            narrativeSource = ai.Source;

            if (request.Forecast != null)
            {
                var aiOk = IsClean(ai.ForecastCommentary);
                forecast.AiCommentary = aiOk ? ai.ForecastCommentary : rules.ForecastCommentary;
                forecast.AiCommentarySource = aiOk ? ai.Source : "rule_based";
            }

            foreach (var o in savings.Opportunities)
            {
                var aiOk = ai.Savings.TryGetValue(o.Id, out var a) && IsClean(a.Title) && IsClean(a.Explanation) && IsClean(a.Action);
                var n = aiOk ? a! : rules.Savings[o.Id];
                o.Title = n.Title;
                o.Explanation = n.Explanation;
                o.Action = n.Action;
                o.NarrativeSource = aiOk ? ai.Source : "rule_based";
            }

            if (request.Habits != null)
            {
                var aiOk = IsClean(ai.HabitsCommentary);
                habits.Commentary = aiOk ? ai.HabitsCommentary : rules.HabitsCommentary;
                habits.CommentarySource = aiOk ? ai.Source : "rule_based";
            }

            if (request.Trend != null)
            {
                var aiOk = IsClean(ai.TrendCommentary);
                trend.Commentary = aiOk ? ai.TrendCommentary : rules.TrendCommentary;
                trend.CommentarySource = aiOk ? ai.Source : "rule_based";
            }
        }

        return new SmartInsightsResponseDto
        {
            GeneratedAtUtc = DateTime.UtcNow,
            Forecast = forecast,
            Anomalies = anomalies,
            Savings = savings,
            SpendingHabits = habits,
            Trend = trend,
            NarrativeSource = narrativeSource,
        };
    }

    private static string? Direction(double? pct) => pct switch
    {
        null => null,
        >= 5 => "up",
        <= -5 => "down",
        _ => "flat",
    };

    private static FinanceNarrativeRequest BuildNarrativeRequest(
        ForecastInsightDto forecast, SavingsInsightDto savings, SpendingHabitsInsightDto habits, FinancialTrendInsightDto trend)
    {
        var req = new FinanceNarrativeRequest();
        if (forecast.Status == "ready" && forecast.PredictedTotal is { } p)
        {
            req.Forecast = new ForecastNarrativeFacts
            {
                TargetMonthLabel = forecast.TargetMonthLabel,
                PredictedTotal = p,
                LowerBound = forecast.LowerBound,
                UpperBound = forecast.UpperBound,
                LastMonthTotal = forecast.LastMonthTotal,
                ChangeVsLastMonthPercent = forecast.ChangeVsLastMonthPercent,
                RecurringComponent = forecast.RecurringComponent,
                DataQualityLevel = forecast.DataQuality.Level,
                ModelName = forecast.ModelName,
                RisingCategories = forecast.CategoryDrivers.Where(c => c.TrendPercent >= 15).Select(c => c.CategoryName).ToList(),
                FallingCategories = forecast.CategoryDrivers.Where(c => c.TrendPercent <= -15).Select(c => c.CategoryName).ToList(),
            };
        }

        req.Savings = savings.Opportunities.Select(o => new SavingsNarrativeFacts
        {
            Id = o.Id,
            Kind = o.Kind,
            CategoryName = o.CategoryName,
            MonthlySaving = o.MonthlySaving,
            CurrentLevel = o.CurrentLevel,
            TargetLevel = o.TargetLevel,
            ReasonCodes = o.ReasonCodes,
            SubscriptionNames = o.RelatedSubscriptions.Select(s => s.Name).ToList(),
        }).ToList();

        if (habits.Status == "ready" && habits.Categories.Count > 0)
        {
            var real = habits.Categories.Where(c => !c.IsOther).ToList();
            var top = real.Count > 0 ? real[0] : habits.Categories[0];
            req.Habits = new HabitsNarrativeFacts
            {
                MonthName = habits.MonthLabel,
                TopCategory = top.CategoryName,
                TopCategoryWeight = top.SharePercent >= 40 ? "dominant" : "leading",
                TotalDirection = Direction(habits.ChangeVsPreviousPercent),
                RisingCategories = real.Where(c => c.ChangePercent >= 20 && c.SharePercent >= 5).Select(c => c.CategoryName).ToList(),
                FallingCategories = real.Where(c => c.ChangePercent <= -20 && c.SharePercent >= 5).Select(c => c.CategoryName).ToList(),
                FixedShareBand = habits.FixedSharePercent >= 60 ? "high" : habits.FixedSharePercent <= 25 ? "low" : "balanced",
            };
        }

        if (trend.Status == "ready")
        {
            var complete = trend.Months.Where(m => !m.IsPartial && m.HasData).ToList();
            var incomeRecorded = complete.Any(m => m.Income > 0);
            string? vsAvg = null;
            if (trend.Forecast != null && trend.AverageMonthlyExpense is > 0)
                vsAvg = Direction((double)((trend.Forecast.Expense - trend.AverageMonthlyExpense.Value) / trend.AverageMonthlyExpense.Value) * 100) switch
                {
                    "up" => "above",
                    "down" => "below",
                    _ => "similar",
                };
            req.Trend = new TrendNarrativeFacts
            {
                LastMonthDirection = Direction(trend.LastCompleteMonthChangePercent),
                HighestExpenseMonthName = trend.HighestExpenseMonthLabel?.Split(' ')[0],
                IncomeRecorded = incomeRecorded,
                MonthsExpenseAboveIncome = incomeRecorded ? complete.Count(m => m.Expense > m.Income) : 0,
                CompleteMonthsWithData = complete.Count,
                MonthsWithoutData = trend.MonthsWithoutData,
                ForecastVsAverage = vsAvg,
            };
        }
        return req;
    }

    /// <summary>AI metni rakam içeremez: finansal rakamlar yalnızca backend hesaplamasından gelir.</summary>
    public static bool IsClean(string? text) =>
        !string.IsNullOrWhiteSpace(text) && text.Length <= 400 && !DigitRegex().IsMatch(text);

    [GeneratedRegex(@"\d")]
    private static partial Regex DigitRegex();

    private static SmartInsightsResponseDto ApplyDismissals(SmartInsightsResponseDto computed, HashSet<string> dismissed)
    {
        var a = computed.Anomalies;
        var visible = a.Items.Where(i => !dismissed.Contains(i.Key)).ToList();
        var anomalies = new AnomalyInsightDto
        {
            Status = a.Status,
            DataQuality = a.DataQuality,
            Items = visible,
            TotalCount = visible.Count,
            TopCategoryName = visible
                .GroupBy(i => i.CategoryName)
                .OrderByDescending(g => g.Sum(x => x.CurrentAmount))
                .Select(g => g.Key)
                .FirstOrDefault(),
            EvaluatedWindowDays = a.EvaluatedWindowDays,
            EvaluatedTransactionCount = a.EvaluatedTransactionCount,
            ExcludedRecurringCount = a.ExcludedRecurringCount,
            DismissedCount = a.Items.Count - visible.Count,
            ModelName = a.ModelName,
            Message = a.Status != "ready"
                ? a.Message
                : visible.Count == 0
                    ? $"Son {a.EvaluatedWindowDays} günde harcamaların alışkanlıklarınla uyumlu."
                    : $"Son {a.EvaluatedWindowDays} günde {visible.Count} olağan dışı durum bulundu.",
        };

        return new SmartInsightsResponseDto
        {
            GeneratedAtUtc = computed.GeneratedAtUtc,
            Forecast = computed.Forecast,
            Anomalies = anomalies,
            Savings = computed.Savings,
            SpendingHabits = computed.SpendingHabits,
            Trend = computed.Trend,
            NarrativeSource = computed.NarrativeSource,
        };
    }

    public async Task<bool> MarkAnomalyAsNormalAsync(int userId, string anomalyKey)
    {
        if (!await KeyBelongsToUserAsync(userId, anomalyKey)) return false;
        await _feedback.AddAsync(userId, anomalyKey);
        return true;
    }

    public Task UnmarkAnomalyAsync(int userId, string anomalyKey) => _feedback.RemoveAsync(userId, anomalyKey);

    [GeneratedRegex(@"^(tx:(?<tx>\d{1,10})|cat-(amount|freq):(?<cat>\d{1,10}):\d{4}-\d{2})$")]
    private static partial Regex KeyRegex();

    private async Task<bool> KeyBelongsToUserAsync(int userId, string key)
    {
        var m = KeyRegex().Match(key ?? "");
        if (!m.Success) return false;
        if (m.Groups["tx"].Success)
        {
            var tx = await _transactions.GetByIdAsync(int.Parse(m.Groups["tx"].Value, CultureInfo.InvariantCulture));
            return tx != null && tx.UserId == userId;
        }
        var cat = await _categories.GetByIdAsync(int.Parse(m.Groups["cat"].Value, CultureInfo.InvariantCulture));
        return cat != null && cat.UserId == userId;
    }

    private T Safe<T>(Func<T> f, string name, Func<T> fallback)
    {
        try
        {
            return f();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Smart insights modülü hata verdi: {Module}", name);
            return fallback();
        }
    }
}
