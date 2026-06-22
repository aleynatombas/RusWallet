using System.Globalization;
using RusWallet.Core.DTOs.Finance;
using RusWallet.Core.Entities;
using RusWallet.Core.Interfaces;

namespace RusWallet.Infrastructure.Services;

/// <summary>
/// Bu ay temposu + yalnızca tamamlanmış ayların ML trendi ile gelecek ay tahmini.
/// Kısmi ay ve kategori toplamı hatalarından kaçınır; tahmin geçmişe göre sınırlanır.
/// </summary>
public sealed class MonthEndPredictiveService : IMonthEndPredictiveService
{
    private static readonly CultureInfo Tr = CultureInfo.GetCultureInfo("tr-TR");

    private const string Disclaimer =
        "Bu bir öngörüdür; harcama hızın değişirse rakam güncellenir. Kesin fatura tutarı değildir.";

    public MonthEndPredictionResult Predict(
        IReadOnlyList<Transaction> expenses,
        DateTime today,
        User? user,
        Func<Transaction, bool> isFlexibleSpend)
    {
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var elapsed = Math.Max(1, today.Day);
        var dim = DateTime.DaysInMonth(today.Year, today.Month);
        var daysRemaining = Math.Max(0, dim - elapsed);

        var spentMtdTotal = expenses
            .Where(t => !t.IsIncome && t.TransactionDate >= monthStart && t.TransactionDate < today.AddDays(1))
            .Sum(t => t.Amount);

        var spentMtdFlexible = expenses
            .Where(t => !t.IsIncome && isFlexibleSpend(t) && t.TransactionDate >= monthStart && t.TransactionDate < today.AddDays(1))
            .Sum(t => t.Amount);

        var spentMtdFixed = Math.Max(0, spentMtdTotal - spentMtdFlexible);

        var dailyAvg = spentMtdTotal > 0 ? Math.Round(spentMtdTotal / elapsed, 0) : 0m;
        var dailyAvgFlexible = spentMtdFlexible > 0 ? Math.Round(spentMtdFlexible / elapsed, 0) : 0m;

        var completeMonthsFlexible = GetCompleteMonthlyTotals(expenses, monthStart, maxMonths: 6, filter: isFlexibleSpend);
        var completeMonthsFixed = GetCompleteMonthlyTotals(expenses, monthStart, maxMonths: 6, filter: t => !isFlexibleSpend(t));
        var recentAvg = completeMonthsFlexible.Count > 0 ? completeMonthsFlexible.TakeLast(3).Average() : 0m;
        var recentMax = completeMonthsFlexible.Count > 0 ? completeMonthsFlexible.Max() : 0m;
        var fixedBaseline = completeMonthsFixed.Count > 0
            ? Math.Round((decimal)completeMonthsFixed.TakeLast(3).Average(), 0)
            : Math.Round(Math.Max(user?.MonthlyFixedCostsApprox ?? 0m, spentMtdFixed), 0);

        var rawProjectedFlexEnd = ProjectMonthEndFromCurrentPace(expenses, today, spentMtdFlexible, completeMonthsFlexible, isFlexibleSpend);
        var projectedFlexEnd = SanitizeProjection(rawProjectedFlexEnd, spentMtdFlexible, completeMonthsFlexible, daysRemaining, dailyAvgFlexible);
        var projectedFixedEnd = Math.Max(spentMtdFixed, fixedBaseline);
        var projectedEnd = projectedFlexEnd + projectedFixedEnd;

        decimal? mlFromCompleteMonths = null;
        if (completeMonthsFlexible.Count >= 2)
        {
            mlFromCompleteMonths = MlNetForecastService.PredictNextMonth(completeMonthsFlexible)
                ?? MLPredictionHelper.PredictNextByLinearRegression(completeMonthsFlexible);
            if (mlFromCompleteMonths is <= 0)
                mlFromCompleteMonths = null;
        }

        decimal? forecastNext = null;
        string explanation;
        string source;
        int confidence;

        if (spentMtdFlexible > 0 || spentMtdFixed > 0)
        {
            // Gelecek ay tahmini: esnek kalemlerde ML/pacing, sabit kalemlerde aylık baseline.
            var baseFlexibleForecast = projectedFlexEnd;
            if (mlFromCompleteMonths is > 0 && completeMonthsFlexible.Count >= 2)
            {
                var clampedMl = ClampToRecentBand(mlFromCompleteMonths.Value, recentAvg, recentMax, projectedFlexEnd);
                baseFlexibleForecast = Math.Round(projectedFlexEnd * 0.82m + clampedMl * 0.18m, 0);
                source = "ml_flexible_with_fixed_baseline";
                confidence = Math.Min(88, 55 + completeMonthsFlexible.Count * 5);
            }
            else
            {
                source = completeMonthsFlexible.Count >= 2 ? "flexible_pace_with_history" : "flexible_pace_linear";
                confidence = completeMonthsFlexible.Count >= 2 ? 60 : 40;
            }

            var nextFlexible = SanitizeProjection(baseFlexibleForecast, spentMtdFlexible, completeMonthsFlexible, dim, dailyAvgFlexible);
            forecastNext = Math.Round(Math.Max(0, nextFlexible) + Math.Max(0, fixedBaseline), 0);
            explanation = BuildExplanationWithPace(
                elapsed, dim, spentMtdFlexible, dailyAvgFlexible, projectedFlexEnd, forecastNext.Value,
                mlFromCompleteMonths, completeMonthsFlexible, recentAvg, fixedBaseline, spentMtdFixed);
        }
        else if (mlFromCompleteMonths is > 0 && completeMonthsFlexible.Count >= 2)
        {
            var nextFlexible = Math.Round(ClampToRecentBand(mlFromCompleteMonths.Value, recentAvg, recentMax, recentAvg), 0);
            forecastNext = Math.Round(Math.Max(0, nextFlexible) + Math.Max(0, fixedBaseline), 0);
            source = "ml_flexible_complete_months";
            confidence = Math.Min(75, 45 + completeMonthsFlexible.Count * 5);
            explanation =
                $"Bu ay esnek harcamada yeterli veri az. Son {completeMonthsFlexible.Count} tam aya göre esnek trend ve sabit gider baseline'ı birlikte kullanıldı; " +
                $"gelecek ay toplam yaklaşık {Fmt(forecastNext.Value)} öngörülüyor.";
            projectedEnd = projectedFixedEnd;
        }
        else
        {
            source = "insufficient_data";
            confidence = 15;
            explanation =
                "Henüz esnek harcama için yeterli veri yok. Birkaç gün işlem eklendikçe esnek harcama tahmini ve uyarılar netleşir.";
            forecastNext = fixedBaseline > 0 ? fixedBaseline : null;
            projectedEnd = projectedFixedEnd;
        }

        decimal? disposable = null;
        if (user?.MonthlyIncomeNet is { } inc && inc > 0)
            disposable = Math.Max(0, inc - (user.MonthlyFixedCostsApprox ?? 0));

        var budgetFillPercent = 0;
        var overPace = false;
        var hasDisposable = disposable is > 0;
        if (hasDisposable)
        {
            budgetFillPercent = (int)Math.Clamp(Math.Round(spentMtdFlexible / disposable!.Value * 100m, 0), 0, 999);
            overPace = projectedFlexEnd > disposable.Value * 1.02m;
        }

        return new MonthEndPredictionResult
        {
            CurrentMonthSpentMtd = spentMtdTotal,
            CurrentMonthDay = elapsed,
            DaysInMonth = dim,
            DailyAverageSpend = dailyAvg,
            ProjectedMonthTotal = projectedEnd,
            ForecastNextMonthTotal = forecastNext is > 0 ? forecastNext : null,
            ForecastExplanation = explanation,
            ForecastDisclaimer = Disclaimer,
            PredictionSource = source,
            PredictionConfidencePercent = Math.Clamp(confidence, 0, 100),
            HasDisposableReference = hasDisposable,
            BudgetFillPercent = budgetFillPercent,
            IsOverPaceVersusDisposable = overPace,
            ProjectedUsesFixedPlusFlexibleSplit = true,
        };
    }

    /// <summary>Yalnızca tamamlanmış takvim ayları (bu ay hariç).</summary>
    private static List<decimal> GetCompleteMonthlyTotals(
        IReadOnlyList<Transaction> expenses,
        DateTime currentMonthStart,
        int maxMonths,
        Func<Transaction, bool>? filter = null)
    {
        var totals = new List<decimal>();
        for (var back = 1; back <= maxMonths; back++)
        {
            var ms = currentMonthStart.AddMonths(-back);
            var me = ms.AddMonths(1);
            var sum = expenses
                .Where(t => !t.IsIncome && t.TransactionDate >= ms && t.TransactionDate < me && (filter == null || filter(t)))
                .Sum(t => t.Amount);
            if (sum > 0)
                totals.Add(sum);
        }

        totals.Reverse();
        return totals;
    }

    private static decimal ProjectMonthEndFromCurrentPace(
        IReadOnlyList<Transaction> expenses,
        DateTime today,
        decimal spentMtd,
        IReadOnlyList<decimal> completeMonths,
        Func<Transaction, bool>? filter = null)
    {
        if (spentMtd <= 0)
            return 0;

        var ratios = new List<(decimal Ratio, int Weight)>();
        for (var back = 1; back <= 6; back++)
        {
            var ms = new DateTime(today.Year, today.Month, 1).AddMonths(-back);
            var monthDim = DateTime.DaysInMonth(ms.Year, ms.Month);
            var takeDays = Math.Min(today.Day, monthDim);
            var sliceEnd = ms.AddDays(takeDays);
            var monthEnd = ms.AddMonths(1);

            var mtd = expenses
                .Where(t => !t.IsIncome && t.TransactionDate >= ms && t.TransactionDate < sliceEnd && (filter == null || filter(t)))
                .Sum(t => t.Amount);
            var full = expenses
                .Where(t => !t.IsIncome && t.TransactionDate >= ms && t.TransactionDate < monthEnd && (filter == null || filter(t)))
                .Sum(t => t.Amount);

            if (mtd > 0 && full >= mtd)
                ratios.Add((full / mtd, 7 - back));
        }

        if (ratios.Count >= 2)
        {
            var weighted = ratios.Sum(r => r.Ratio * r.Weight);
            var totalW = ratios.Sum(r => r.Weight);
            var avgRatio = Math.Clamp(weighted / totalW, 1m, 2.2m);
            return Math.Round(spentMtd * avgRatio, 0);
        }

        var dim = DateTime.DaysInMonth(today.Year, today.Month);
        var elapsed = Math.Max(1, today.Day);
        var linear = spentMtd / elapsed * dim;

        if (completeMonths.Count > 0)
        {
            var recentAvg = completeMonths.TakeLast(3).Average();
            linear = Math.Min(linear, (decimal)recentAvg * 1.35m);
        }

        return Math.Round(linear, 0);
    }

    private static decimal SanitizeProjection(
        decimal value,
        decimal spentMtd,
        IReadOnlyList<decimal> completeMonths,
        int daysHorizon,
        decimal dailyAvg)
    {
        if (value <= 0) return 0;

        if (completeMonths.Count == 0)
        {
            var linearCap = spentMtd > 0 ? spentMtd + dailyAvg * daysHorizon : value;
            return Math.Round(Math.Min(value, linearCap * 1.15m), 0);
        }

        var recentAvg = (decimal)completeMonths.TakeLast(3).Average();
        var recentMax = (decimal)completeMonths.Max();
        var floor = Math.Max(spentMtd, recentAvg * 0.75m);
        var ceiling = Math.Max(recentMax * 1.15m, recentAvg * 1.35m);

        if (spentMtd > recentAvg * 1.5m)
            ceiling = Math.Max(ceiling, spentMtd * 1.1m);

        return Math.Round(Math.Clamp(value, floor, ceiling), 0);
    }

    private static decimal ClampToRecentBand(decimal mlValue, decimal recentAvg, decimal recentMax, decimal anchor)
    {
        if (recentAvg <= 0)
            return mlValue;

        var lo = Math.Min(recentAvg * 0.7m, anchor * 0.85m);
        var hi = Math.Max(recentMax * 1.15m, Math.Max(recentAvg * 1.35m, anchor * 1.15m));
        return Math.Clamp(mlValue, lo, hi);
    }

    private static string BuildExplanationWithPace(
        int elapsed,
        int dim,
        decimal spentMtd,
        decimal dailyAvg,
        decimal projectedEnd,
        decimal forecastNext,
        decimal? mlHistory,
        IReadOnlyList<decimal> completeMonths,
        decimal recentAvg,
        decimal fixedBaseline,
        decimal spentMtdFixed)
    {
        var baseText =
            $"Ayın {elapsed}. günündesin. Esnek harcama bugüne kadar {Fmt(spentMtd)} (günde ~{Fmt(dailyAvg)}). " +
            $"Bu tempo ile esnek kalemler ay sonunda yaklaşık {Fmt(projectedEnd)} olabilir. " +
            $"Sabit gider bazın ~{Fmt(fixedBaseline)} (bu ay işlenen sabit: {Fmt(spentMtdFixed)}).";

        if (completeMonths.Count >= 2 && recentAvg > 0)
        {
            var hist =
                $" Son {Math.Min(3, completeMonths.Count)} tam ay esnek ortalaman {Fmt(recentAvg)}.";
            var mlNote = mlHistory is > 0
                ? $" Gelecek ay toplamı (esnek trend + sabit baz) yaklaşık {Fmt(forecastNext)} öngörülüyor."
                : $" Gelecek ay toplam tahmini bu banda yakın: {Fmt(forecastNext)}.";
            return baseText + hist + mlNote;
        }

        return baseText + $" Aynı hız sürerse gelecek ay toplamı da yaklaşık {Fmt(forecastNext)} olabilir.";
    }

    private static string Fmt(decimal n) =>
        $"{n.ToString("N0", Tr)} ₺";
}
