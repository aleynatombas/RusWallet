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

        var fingerprint = string.Join('|',
            today.ToString("yyyyMMdd", CultureInfo.InvariantCulture),
            expenses.Count,
            expenses.Count == 0 ? 0 : expenses.Max(e => e.TransactionId),
            expenses.Sum(e => e.Amount).ToString(CultureInfo.InvariantCulture),
            expenses.Aggregate(17, (h, e) => HashCode.Combine(h, e.CategoryId, e.Date, e.Description)));
        var cacheKey = $"smart-insights:{userId}:{fingerprint}";

        if (!_cache.TryGetValue(cacheKey, out SmartInsightsResponseDto? computed) || computed == null)
        {
            computed = await ComputeAsync(expenses, today, cancellationToken);
            _cache.Set(cacheKey, computed, CacheDuration);
        }

        var dismissed = await _feedback.GetKeysAsync(userId);
        return ApplyDismissals(computed, dismissed);
    }

    private async Task<SmartInsightsResponseDto> ComputeAsync(List<ExpenseRecord> expenses, DateTime today, CancellationToken ct)
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

        var request = BuildNarrativeRequest(forecast, savings);
        var narrativeSource = "rule_based";
        if (request.Forecast != null || request.Savings.Count > 0)
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
        }

        return new SmartInsightsResponseDto
        {
            GeneratedAtUtc = DateTime.UtcNow,
            Forecast = forecast,
            Anomalies = anomalies,
            Savings = savings,
            NarrativeSource = narrativeSource,
        };
    }

    private static FinanceNarrativeRequest BuildNarrativeRequest(ForecastInsightDto forecast, SavingsInsightDto savings)
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
