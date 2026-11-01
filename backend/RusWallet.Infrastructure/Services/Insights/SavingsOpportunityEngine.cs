using System.Globalization;
using RusWallet.Core.DTOs.Finance;

namespace RusWallet.Infrastructure.Services.Insights;

/// <summary>
/// Tasarruf fırsatlarını ve tutarlarını hesaplar. Bütün rakamlar burada üretilir; AI yalnızca bunları yorumlar.
///
/// 1) Kategori azaltımı (esnek kategoriler, son 6 tam ay):
///    beklenen seviye = ML.NET regresyon tahmini ile son 3 ay ortalamasının harmanı (veri yoksa son 3 ay ortalaması),
///    hedef seviye = kullanıcının kendi aylarının %40 yüzdeliği ("iyi ay" seviyesi),
///    tasarruf = beklenen − hedef; beklenenin %30'u ile sınırlı.
/// 2) Abonelik fiyat artışı: düzenli ödemenin son tutarı ilk tutarından ≥ %10 fazlaysa fark.
/// 3) Çakışan abonelikler: aynı kategoride ≥ 2 abonelik varsa en düşüğü.
/// Sıralama: öncelik = aylık tasarruf × güven katsayısı.
/// </summary>
public static class SavingsOpportunityEngine
{
    private static readonly CultureInfo Tr = CultureInfo.GetCultureInfo("tr-TR");
    public const int MinCompleteMonths = 3;
    private const double TargetPercentile = 0.40;
    private const decimal MaxReductionShare = 0.30m;

    public static SavingsInsightDto Build(
        IReadOnlyList<ExpenseRecord> expenses,
        IReadOnlyList<RecurringPayment> recurring,
        DateTime today)
    {
        today = today.Date;
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var dto = new SavingsInsightDto();

        var firstMonth = expenses.Count == 0 ? monthStart : new DateTime(expenses.Min(e => e.Date).Year, expenses.Min(e => e.Date).Month, 1);
        var months = Enumerable.Range(1, 6)
            .Select(back => monthStart.AddMonths(-back))
            .Where(m => m >= firstMonth)
            .OrderBy(m => m)
            .ToList();

        var activeSubs = recurring.Where(r => r.IsActive && r.IsSubscription).ToList();
        dto.MonthlySubscriptionTotal = Math.Round(activeSubs.Sum(s => s.ExpectedAmount), 0);
        dto.DataQuality = new DataSufficiencyDto
        {
            CompleteMonths = months.Count,
            ExpenseTransactionCount = expenses.Count,
            HistoryDays = expenses.Count == 0 ? 0 : (int)(today - expenses.Min(e => e.Date).Date).TotalDays + 1,
            RequiredHistoryDays = MinCompleteMonths * 30,
            RequiredTransactions = 20,
        };

        if (months.Count < MinCompleteMonths || expenses.Count < 20)
        {
            dto.Status = "insufficient_data";
            dto.DataQuality.Level = "insufficient";
            dto.DataQuality.Message = months.Count < MinCompleteMonths
                ? $"Kişisel tasarruf hedefi hesaplamak için en az {MinCompleteMonths} tam aylık harcama geçmişi gerekiyor (şu an {months.Count})."
                : $"Kategori karşılaştırması için en az 20 gider kaydı gerekiyor (şu an {expenses.Count}).";
            dto.Message = dto.DataQuality.Message;
            return dto;
        }

        dto.DataQuality.Level = months.Count >= 5 ? "good" : "limited";
        dto.DataQuality.Message = $"Son {months.Count} tam ayın kategori harcamaları karşılaştırıldı.";

        var recurringIds = recurring.SelectMany(r => r.TransactionIds).ToHashSet();
        var flexible = expenses
            .Where(e => !recurringIds.Contains(e.TransactionId) && !SpendingCategoryClassifier.IsFixedCategory(e.CategoryName))
            .ToList();
        var flexMonthlyTotal = months.Average(m => flexible.Where(e => e.Date >= m && e.Date < m.AddMonths(1)).Sum(e => e.Amount));
        var minMeaningful = Math.Max(50m, flexMonthlyTotal * 0.03m);

        var opportunities = new List<SavingsOpportunityDto>();

        // 1) Kategori azaltımı
        foreach (var g in flexible.GroupBy(e => e.CategoryId))
        {
            var name = g.First().CategoryName;
            var series = months.Select(m => g.Where(e => e.Date >= m && e.Date < m.AddMonths(1)).Sum(e => e.Amount)).ToList();
            if (series.Count(v => v > 0) < 2) continue;

            var doubles = series.Select(v => (double)v).ToList();
            var avg = (decimal)Stats.Mean(doubles);
            var last3 = series.TakeLast(3).Average();
            var prev = series.Count > 3 ? series.Take(series.Count - 3).Average() : (decimal?)null;
            var median = (decimal)Stats.Median(doubles);
            var cv = Stats.CoefficientOfVariation(doubles);

            // ML.NET regresyon trendi, son 3 ay ortalamasıyla harmanlanır ve ±%30 bantta tutulur
            // (kısa serilerde doğrusal trendin aşırı uzamasını önler).
            var ml = MlNetForecastService.PredictNextMonth(series);
            var usedMl = ml is > 0;
            var expected = usedMl
                ? Math.Clamp(ml!.Value * 0.5m + last3 * 0.5m, last3 * 0.7m, last3 * 1.3m)
                : last3;
            var target = (decimal)Stats.Percentile(doubles.Where(v => v > 0).ToList(), TargetPercentile);
            var saving = Math.Min(expected - target, expected * MaxReductionShare);
            saving = Math.Floor(Math.Max(0, saving) / 10m) * 10m;
            if (saving < minMeaningful) continue;

            var codes = new List<string>();
            var reasons = new List<string>();
            if (prev is > 0 && last3 > prev.Value * 1.15m)
            {
                codes.Add("trend_up");
                reasons.Add($"Son 3 ay ortalaması önceki döneme göre %{Math.Round((last3 / prev.Value - 1) * 100, 0)} arttı.");
            }
            if (median > 0 && series[^1] > median * 1.25m)
            {
                codes.Add("above_typical");
                reasons.Add($"Geçen ay {Fmt(series[^1])}, tipik ayın ise {Fmt(median)}.");
            }
            if (cv > 0.35)
            {
                codes.Add("high_volatility");
                reasons.Add("Aydan aya harcama çok dalgalı; bazı aylar belirgin şekilde daha düşük.");
            }
            var share = flexMonthlyTotal > 0 ? avg / flexMonthlyTotal : 0;
            if (share >= 0.25m)
            {
                codes.Add("large_share");
                reasons.Add($"Esnek harcamalarının %{Math.Round(share * 100, 0)}'i bu kategoride.");
            }
            reasons.Add($"Hedef seviye, kendi aylarının daha düşük harcadığın dilimine ({Fmt(target)}) göre belirlendi.");

            var confidence = months.Count >= 5 && cv < 0.5 ? "high" : months.Count >= 4 ? "medium" : "low";
            opportunities.Add(new SavingsOpportunityDto
            {
                Id = $"cat:{g.Key}",
                Kind = "category_reduction",
                CategoryName = name,
                MonthlySaving = saving,
                YearlySaving = saving * 12,
                CurrentLevel = Math.Round(expected, 0),
                TargetLevel = Math.Round(target, 0),
                Confidence = confidence,
                PriorityScore = Math.Round((double)saving * ConfidenceFactor(confidence), 1),
                ReasonCodes = codes,
                Reasons = reasons,
                MonthlyHistory = months.Select((m, i) => new MonthAmountDto { Label = m.ToString("MMM yy", Tr), Amount = Math.Round(series[i], 0) }).ToList(),
                UsedMlForecast = usedMl,
            });
        }

        // 2) Abonelik fiyat artışı
        foreach (var s in activeSubs.Where(s => s.FirstAmount > 0 && s.LatestAmount >= s.FirstAmount * 1.10m))
        {
            var diff = Math.Round(s.LatestAmount - s.FirstAmount, 0);
            if (diff < 10) continue;
            opportunities.Add(new SavingsOpportunityDto
            {
                Id = $"sub-price:{s.CategoryId}:{SpendingCategoryClassifier.DescriptionKey(s.Name)}",
                Kind = "subscription_price_increase",
                CategoryName = s.CategoryName,
                MonthlySaving = diff,
                YearlySaving = diff * 12,
                CurrentLevel = Math.Round(s.LatestAmount, 0),
                TargetLevel = Math.Round(s.FirstAmount, 0),
                Confidence = "high",
                PriorityScore = Math.Round((double)diff * ConfidenceFactor("high"), 1),
                ReasonCodes = new() { "subscription_price_increase" },
                Reasons = new() { $"{s.Name} ödemesi {Fmt(s.FirstAmount)} iken {Fmt(s.LatestAmount)} oldu." },
                RelatedSubscriptions = new() { SpendingForecastEngine.ToDto(s) },
            });
        }

        // 3) Aynı kategoride birden fazla abonelik
        foreach (var g in activeSubs.GroupBy(s => s.CategoryId).Where(g => g.Count() >= 2))
        {
            var cheapest = g.OrderBy(s => s.ExpectedAmount).First();
            var saving = Math.Round(cheapest.ExpectedAmount, 0);
            if (saving < 10) continue;
            opportunities.Add(new SavingsOpportunityDto
            {
                Id = $"sub-overlap:{g.Key}",
                Kind = "overlapping_subscriptions",
                CategoryName = cheapest.CategoryName,
                MonthlySaving = saving,
                YearlySaving = saving * 12,
                CurrentLevel = Math.Round(g.Sum(s => s.ExpectedAmount), 0),
                TargetLevel = Math.Round(g.Sum(s => s.ExpectedAmount) - saving, 0),
                Confidence = "medium",
                PriorityScore = Math.Round((double)saving * ConfidenceFactor("medium"), 1),
                ReasonCodes = new() { "overlapping_subscriptions" },
                Reasons = new() { $"{cheapest.CategoryName} kategorisinde {g.Count()} aktif düzenli abonelik var." },
                RelatedSubscriptions = g.Select(SpendingForecastEngine.ToDto).ToList(),
            });
        }

        dto.Opportunities = opportunities.OrderByDescending(o => o.PriorityScore).Take(6).ToList();
        dto.TotalMonthlyPotential = dto.Opportunities.Sum(o => o.MonthlySaving);
        dto.TotalYearlyPotential = dto.TotalMonthlyPotential * 12;
        dto.Status = "ready";
        dto.Message = dto.Opportunities.Count == 0
            ? "Harcamaların kendi tipik seviyende; şu an belirgin bir tasarruf fırsatı yok."
            : $"{dto.Opportunities.Count} fırsat tasarruf etkisine göre sıralandı.";
        return dto;
    }

    private static double ConfidenceFactor(string c) => c switch { "high" => 1.0, "medium" => 0.8, _ => 0.6 };

    private static string Fmt(decimal n) => $"{n.ToString("N0", Tr)} ₺";
}
