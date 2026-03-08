using RusWallet.Core.DTOs.Finance;
using RusWallet.Core.Interfaces;

namespace RusWallet.Infrastructure.Services;

/// <summary>ML/istatistik tabanlı bütçe önerisi ve anomali tespiti.</summary>
public class FinanceMLService : IFinanceMLService
{
    private readonly ITransactionRepository _transactionRepository;

    public FinanceMLService(ITransactionRepository transactionRepository)
    {
        _transactionRepository = transactionRepository;
    }

    public async Task<BudgetSuggestionsResponseDto> GetBudgetSuggestionsAsync(int userId, int lastMonths = 6)
    {
        var end = DateTime.Today;
        var start = end.AddMonths(-lastMonths);
        var transactions = await _transactionRepository.GetByUserAndDateRangeAsync(userId, start, end, isIncome: false);

        var totalExpense = transactions.Sum(t => t.Amount);
        // Kategori bazında kronolojik aylık toplamlar (kategorisizler "Kategorisiz" olarak dahil)
        var byCategoryMonthly = transactions
            .GroupBy(t => new { t.TransactionDate.Year, t.TransactionDate.Month, CategoryId = t.Category != null ? t.CategoryId : 0, Name = t.Category?.Name ?? "Kategorisiz" })
            .Select(g => new { g.Key.CategoryId, g.Key.Name, g.Key.Year, g.Key.Month, Sum = g.Sum(x => x.Amount) })
            .GroupBy(x => new { x.CategoryId, x.Name })
            .ToDictionary(g => g.Key, g => g.OrderBy(m => m.Year).ThenBy(m => m.Month).Select(m => m.Sum).ToList());

        var monthsInRange = Enumerable.Range(0, lastMonths)
            .Select(i => start.AddMonths(i))
            .Where(d => d < end)
            .Select(d => (d.Year, d.Month))
            .ToHashSet();
        int monthsUsed = monthsInRange.Count > 0 ? monthsInRange.Count : 1;

        var suggestions = new List<BudgetSuggestionDto>();
        foreach (var kv in byCategoryMonthly.OrderByDescending(x => x.Value.Sum()))
        {
            var key = kv.Key;
            var monthlyTotals = kv.Value;
            var sum = monthlyTotals.Sum();
            var avg = monthsUsed > 0 ? sum / monthsUsed : sum;
            var mlSuggested = MlNetForecastService.PredictNextMonth(monthlyTotals);
            var suggestedAmount = mlSuggested.HasValue && mlSuggested.Value > 0
                ? Math.Round(mlSuggested.Value, 2)
                : Math.Round(avg, 2);

            suggestions.Add(new BudgetSuggestionDto
            {
                CategoryId = key.CategoryId,
                CategoryName = key.Name,
                AverageSpent = avg,
                SuggestedAmount = suggestedAmount,
                PercentageOfTotal = totalExpense > 0 ? (double)(sum * 100 / totalExpense) : 0,
                MonthsUsed = monthsUsed,
                SuggestedByML = mlSuggested.HasValue && mlSuggested.Value > 0
            });
        }

        string? message;
        if (suggestions.Count == 0)
            message = transactions.Count == 0
                ? "Henüz harcama kaydı yok. En az 1 ayda, kategorilere göre harcama eklediğinizde burada öneri listesi görünecektir. Bir kategoride 2 veya daha fazla ay verisi olduğunda ML ile tahmin (suggestedByML: true), tek ay varsa ortalama kullanılır."
                : "Bütçe önerisi için en az bir kategoride harcama kaydı gerekiyor. Harcamalarınızı kategorilere atayıp kaydettikten sonra tekrar deneyin. (Bir kategoride 2+ ay veri olunca ML tahmini devreye girer.)";
        else
            message = $"Son {monthsUsed} aya göre kategori bazında bütçe önerileri. 2+ ay verisi olan kategorilerde ML tahmini (suggestedByML: true), diğerlerinde ortalama kullanıldı.";

        return new BudgetSuggestionsResponseDto
        {
            Suggestions = suggestions,
            MonthsAnalyzed = monthsUsed,
            Message = message
        };
    }

    public async Task<AnomaliesResponseDto> GetAnomaliesAsync(int userId, DateTime? forMonth = null, int historicalMonths = 6)
    {
        var targetMonth = forMonth ?? DateTime.Today;
        var periodStart = new DateTime(targetMonth.Year, targetMonth.Month, 1);
        var periodEnd = periodStart.AddMonths(1);
        var historyStart = periodStart.AddMonths(-historicalMonths);

        var currentTransactions = await _transactionRepository.GetByUserAndDateRangeAsync(userId, periodStart, periodEnd, isIncome: false);
        var historicalTransactions = await _transactionRepository.GetByUserAndDateRangeAsync(userId, historyStart, periodStart, isIncome: false);

        var currentByCategory = currentTransactions
            .GroupBy(t => new { CategoryId = t.Category != null ? t.CategoryId : 0, Name = t.Category?.Name ?? "Kategorisiz" })
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Amount));

        var historicalByCategory = historicalTransactions
            .GroupBy(t => new { t.TransactionDate.Year, t.TransactionDate.Month, CategoryId = t.Category != null ? t.CategoryId : 0, Name = t.Category?.Name ?? "Kategorisiz" })
            .Select(g => new { g.Key.CategoryId, g.Key.Name, Sum = g.Sum(x => x.Amount) })
            .GroupBy(x => new { x.CategoryId, x.Name })
            .ToDictionary(g => g.Key, g => g.Select(x => x.Sum).ToList());

        var anomalies = new List<AnomalyAlertDto>();
        foreach (var kv in currentByCategory)
        {
            var key = kv.Key;
            var currentAmount = kv.Value;
            if (!historicalByCategory.TryGetValue(key, out var pastAmounts) || pastAmounts.Count < 2)
                continue;

            double mean = MLPredictionHelper.Mean(pastAmounts);
            double std = MLPredictionHelper.StandardDeviation(pastAmounts);
            double zScore = MLPredictionHelper.ZScore(currentAmount, mean, std);

            // ML.NET Time Series (IID Spike) ile anomali tespiti; yoksa z-score fallback
            var fullSeries = pastAmounts.Concat(new[] { currentAmount }).ToList();
            bool mlSpike = MlNetAnomalyService.IsLastPointSpike(fullSeries, confidence: 95);
            bool zScoreAnomaly = zScore >= 2.0;
            if (!mlSpike && !zScoreAnomaly) continue;

            string severity = (mlSpike ? 3.0 : zScore) >= 3 ? "Yüksek" : "Orta";
            string message = std > 0
                ? $"{key.Name} bu ay ortalamadan {zScore:F1} standart sapma fazla (ortalama: {mean:F0} TL, bu ay: {currentAmount:F0} TL)."
                : $"{key.Name} bu ay {currentAmount:F0} TL (geçmişe göre yüksek).";

            anomalies.Add(new AnomalyAlertDto
            {
                CategoryName = key.Name,
                CategoryId = key.CategoryId,
                CurrentAmount = currentAmount,
                HistoricalAverage = (decimal)mean,
                StandardDeviation = (decimal)std,
                ZScore = zScore,
                Severity = severity,
                Message = message,
                DetectedByML = mlSpike
            });
        }

        // Toplam harcama anomalisi: ML spike veya z-score
        var currentTotal = currentTransactions.Sum(t => t.Amount);
        var historicalMonthlyTotals = historicalTransactions
            .GroupBy(t => new { t.TransactionDate.Year, t.TransactionDate.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g => g.Sum(x => x.Amount))
            .ToList();
        if (historicalMonthlyTotals.Count >= 2)
        {
            var totalSeries = historicalMonthlyTotals.Concat(new[] { currentTotal }).ToList();
            bool totalMlSpike = MlNetAnomalyService.IsLastPointSpike(totalSeries, confidence: 95);
            double totalMean = MLPredictionHelper.Mean(historicalMonthlyTotals);
            double totalStd = MLPredictionHelper.StandardDeviation(historicalMonthlyTotals);
            double totalZ = MLPredictionHelper.ZScore(currentTotal, totalMean, totalStd);
            if (totalMlSpike || totalZ >= 2.0)
            {
                anomalies.Add(new AnomalyAlertDto
                {
                    CategoryName = "Toplam",
                    CategoryId = null,
                    CurrentAmount = currentTotal,
                    HistoricalAverage = (decimal)totalMean,
                    StandardDeviation = (decimal)totalStd,
                    ZScore = totalZ,
                    Severity = (totalMlSpike ? 3.0 : totalZ) >= 3 ? "Yüksek" : "Orta",
                    Message = $"Toplam harcama bu ay ortalamadan {totalZ:F1} standart sapma fazla (ortalama: {totalMean:F0} TL, bu ay: {currentTotal:F0} TL).",
                    DetectedByML = totalMlSpike
                });
            }
        }

        var ordered = anomalies.OrderByDescending(a => a.ZScore).ToList();
        string? responseMessage = null;
        if (ordered.Count == 0)
            responseMessage = currentTransactions.Count == 0
                ? "Bu ay henüz harcama kaydı yok."
                : (historicalTransactions.Count < 2 ? "Anomali karşılaştırması için en az 2 ay geçmiş veri gerekir." : "Bu ay için alışılmadık harcama tespit edilmedi.");

        return new AnomaliesResponseDto
        {
            Anomalies = ordered,
            PeriodStart = periodStart,
            PeriodEnd = periodEnd,
            MonthsCompared = historicalMonths,
            Message = responseMessage
        };
    }
}
