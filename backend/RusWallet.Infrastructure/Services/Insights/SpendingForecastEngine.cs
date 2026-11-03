using System.Globalization;
using Microsoft.ML;
using Microsoft.ML.Transforms.TimeSeries;
using RusWallet.Core.DTOs.Finance;

namespace RusWallet.Infrastructure.Services.Insights;

/// <summary>
/// Gelecek ay toplam harcama tahmini.
///
/// Yöntem:
///  1. Düzenli ödemeler (<see cref="RecurringPaymentDetector"/>) ayrılır ve beklenen tutarlarıyla eklenir.
///  2. Kalan değişken harcamalar günlük zaman serisine çevrilir.
///  3. ML.NET Singular Spectrum Analysis (ForecastBySsa, 7 günlük pencere = haftalık döngü) ile günlük tahmin yapılır.
///  4. Model, son 28 gün saklanarak geçmiş üzerinde sınanır ve haftanın günü ortalaması temel modeliyle
///     karşılaştırılır; hatası daha düşük olan model seçilir.
///  5. Tahmin aralığı: SSA'nın günlük %90 sınırlarının kareler toplamının kökü, backtest hatasından dar olmayacak şekilde.
/// </summary>
public static class SpendingForecastEngine
{
    private static readonly CultureInfo Tr = CultureInfo.GetCultureInfo("tr-TR");
    private const int SsaWindow = 7;
    private const int HoldoutDays = 28;
    public const int MinHistoryDays = 45;
    public const int MinTransactions = 15;
    private const int GoodHistoryDays = 90;

    public static ForecastInsightDto Build(
        IReadOnlyList<ExpenseRecord> expenses,
        IReadOnlyList<RecurringPayment> recurring,
        DateTime today)
    {
        today = today.Date;
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var nextMonthStart = monthStart.AddMonths(1);
        var dto = new ForecastInsightDto
        {
            TargetYear = nextMonthStart.Year,
            TargetMonth = nextMonthStart.Month,
            TargetMonthLabel = nextMonthStart.ToString("MMMM yyyy", Tr),
            CurrentMonthActualToDate = expenses.Where(e => e.Date >= monthStart && e.Date < today.AddDays(1)).Sum(e => e.Amount),
        };

        var completeMonthTotals = CompleteMonthTotals(expenses, monthStart, 6);
        dto.LastMonthTotal = completeMonthTotals.Count > 0 && completeMonthTotals[^1].Total > 0 ? completeMonthTotals[^1].Total : null;
        dto.Series = completeMonthTotals
            .Select(m => new ForecastSeriesPointDto
            {
                Year = m.Start.Year, Month = m.Start.Month, Label = ShortLabel(m.Start),
                // Hiç gider kaydı olmayan ay 0 değil "veri yok" (null): grafik orada boşluk bırakır.
                Actual = m.Total > 0 ? m.Total : null, Kind = "complete",
            })
            .ToList();
        dto.CategoryDrivers = BuildCategoryDrivers(expenses, monthStart);
        dto.RecurringPayments = recurring.Where(r => r.IsActive).Take(8).Select(ToDto).ToList();

        dto.DataQuality = Assess(expenses, today, monthStart);
        if (dto.DataQuality.Level == "insufficient")
        {
            dto.Status = "insufficient_data";
            dto.Message = dto.DataQuality.Message;
            AppendCurrentMonthPoint(dto, monthStart, null);
            return dto;
        }

        // ── Değişken günlük seri (bugün hariç, tamamlanmış günler) ──
        var recurringIds = recurring.SelectMany(r => r.TransactionIds).ToHashSet();
        var firstDay = expenses.Min(e => e.Date).Date;
        if (firstDay < today.AddDays(-365)) firstDay = today.AddDays(-365);
        var daily = BuildDailySeries(expenses.Where(e => !recurringIds.Contains(e.TransactionId)), firstDay, today);

        var dimCurrent = DateTime.DaysInMonth(today.Year, today.Month);
        var dimNext = DateTime.DaysInMonth(nextMonthStart.Year, nextMonthStart.Month);
        var remainingAfterToday = dimCurrent - today.Day;
        var horizon = 1 + remainingAfterToday + dimNext; // indeks 0 = bugün

        // ── Backtest: son 28 günü sakla, iki modeli karşılaştır ──
        ForecastBacktestDto? backtest = null;
        if (daily.Length >= HoldoutDays + 4 * SsaWindow)
        {
            var train = daily[..^HoldoutDays];
            var actual = (decimal)daily[^HoldoutDays..].Sum();
            var basePred = (decimal)WeekdayBaseline(train, firstDay, HoldoutDays).Sum();
            var ssa = TrySsa(train, HoldoutDays);
            var ssaPred = ssa == null ? (decimal?)null : (decimal)ssa.Value.Forecast.Sum();
            backtest = new ForecastBacktestDto
            {
                HoldoutDays = HoldoutDays,
                ActualTotal = Math.Round(actual, 0),
                BaselinePredictedTotal = Math.Round(basePred, 0),
                BaselineErrorPercent = ErrorPercent(basePred, actual),
                SsaPredictedTotal = ssaPred.HasValue ? Math.Round(ssaPred.Value, 0) : null,
                SsaErrorPercent = ssaPred.HasValue ? ErrorPercent(ssaPred.Value, actual) : null,
            };
            backtest.SelectedModel = backtest.SsaErrorPercent.HasValue && backtest.SsaErrorPercent <= backtest.BaselineErrorPercent
                ? "ssa" : "seasonal_baseline";
        }

        var useSsa = backtest?.SelectedModel == "ssa" || (backtest == null && daily.Length >= 3 * SsaWindow);
        double[] forecast;
        double[]? halfWidths = null;
        if (useSsa && TrySsa(daily, horizon) is { } ssaFull)
        {
            forecast = ssaFull.Forecast;
            halfWidths = ssaFull.HalfWidths;
            dto.Method = "ssa";
            dto.ModelName = "ML.NET Singular Spectrum Analysis (ForecastBySsa)";
        }
        else
        {
            forecast = WeekdayBaseline(daily, firstDay, horizon);
            dto.Method = "seasonal_baseline";
            dto.ModelName = "Haftanın günü ortalaması (temel model)";
            if (backtest != null) backtest.SelectedModel = "seasonal_baseline";
        }
        dto.Backtest = backtest;

        var nextSlice = forecast.Skip(1 + remainingAfterToday).Take(dimNext).ToArray();
        var variableNext = (decimal)nextSlice.Sum();
        var activeRecurring = recurring.Where(r => r.IsActive).ToList();
        var recurringNext = activeRecurring.Sum(r => r.ExpectedAmount);

        // Tahmin aralığı (%90)
        double half;
        if (halfWidths != null)
            half = Math.Sqrt(halfWidths.Skip(1 + remainingAfterToday).Take(dimNext).Sum(h => h * h));
        else
            half = 1.645 * Stats.StdDev(daily.TakeLast(56).ToList()) * Math.Sqrt(dimNext);
        var selectedErr = dto.Method == "ssa" ? backtest?.SsaErrorPercent : backtest?.BaselineErrorPercent;
        if (selectedErr is > 0)
            half = Math.Max(half, (double)variableNext * Math.Min(selectedErr.Value, 100) / 100.0);

        var predicted = Math.Round(variableNext + recurringNext, 0);
        dto.VariableComponent = Math.Round(variableNext, 0);
        dto.RecurringComponent = Math.Round(recurringNext, 0);
        dto.PredictedTotal = predicted;
        dto.LowerBound = Math.Round(Math.Max(recurringNext, predicted - (decimal)half), 0);
        dto.UpperBound = Math.Round(predicted + (decimal)half, 0);
        if (dto.LastMonthTotal is > 0)
            dto.ChangeVsLastMonthPercent = Math.Round((double)((predicted - dto.LastMonthTotal.Value) / dto.LastMonthTotal.Value * 100m), 1);

        // Bu ay sonu projeksiyonu: gerçekleşen + kalan günlerin tahmini + henüz ödenmemiş düzenli ödemeler
        var remainingVariable = (decimal)forecast.Skip(1).Take(remainingAfterToday).Sum();
        var paidThisMonth = expenses.Where(e => e.Date >= monthStart).Select(e => e.TransactionId).ToHashSet();
        var pendingRecurring = activeRecurring
            .Where(r => !r.TransactionIds.Any(paidThisMonth.Contains) && r.TypicalDayOfMonth > today.Day)
            .Sum(r => r.ExpectedAmount);
        dto.CurrentMonthProjectedTotal = Math.Round(dto.CurrentMonthActualToDate + remainingVariable + pendingRecurring, 0);

        AppendCurrentMonthPoint(dto, monthStart, dto.CurrentMonthProjectedTotal);
        dto.Series.Add(new ForecastSeriesPointDto
        {
            Year = nextMonthStart.Year, Month = nextMonthStart.Month, Label = ShortLabel(nextMonthStart),
            Forecast = dto.PredictedTotal, Lower = dto.LowerBound, Upper = dto.UpperBound, Kind = "forecast",
        });

        dto.Status = "ready";
        dto.Message = dto.DataQuality.Level == "limited"
            ? "Tahmin sınırlı veriye dayanıyor; aralık geniş tutuldu."
            : "Tahmin, geçmiş günlük harcamaların zaman serisi modeli ve düzenli ödemelerle üretildi.";
        return dto;
    }

    /// <summary>
    /// Model, uç işlemler çıkarılmış veriyle çalıştıysa grafikteki ve karşılaştırmalardaki gerçekleşen
    /// tutarları tüm işlemlerle yeniden hesaplar (kullanıcı harcadığı gerçek tutarı görmeli).
    /// </summary>
    public static void RestoreActuals(ForecastInsightDto dto, IReadOnlyList<ExpenseRecord> allExpenses, DateTime today)
    {
        today = today.Date;
        var monthStart = new DateTime(today.Year, today.Month, 1);
        decimal Sum(DateTime s, DateTime e) => allExpenses.Where(x => x.Date >= s && x.Date < e).Sum(x => x.Amount);

        foreach (var p in dto.Series.Where(p => p.Kind == "complete"))
        {
            var s = new DateTime(p.Year, p.Month, 1);
            var total = Sum(s, s.AddMonths(1));
            p.Actual = total > 0 ? total : null;
        }

        var fullMtd = Sum(monthStart, today.AddDays(1));
        var extraMtd = fullMtd - dto.CurrentMonthActualToDate;
        dto.CurrentMonthActualToDate = fullMtd;
        if (dto.CurrentMonthProjectedTotal.HasValue)
            dto.CurrentMonthProjectedTotal = Math.Round(dto.CurrentMonthProjectedTotal.Value + extraMtd, 0);
        var current = dto.Series.FirstOrDefault(p => p.Kind == "current");
        if (current != null)
        {
            current.Actual = fullMtd;
            current.Forecast = dto.CurrentMonthProjectedTotal;
        }

        var last = dto.Series.LastOrDefault(p => p.Kind == "complete");
        dto.LastMonthTotal = last?.Actual is > 0 ? last.Actual : null;
        dto.ChangeVsLastMonthPercent = dto.LastMonthTotal is > 0 && dto.PredictedTotal.HasValue
            ? Math.Round((double)((dto.PredictedTotal.Value - dto.LastMonthTotal.Value) / dto.LastMonthTotal.Value * 100m), 1)
            : null;
    }

    // ── Yardımcılar ───────────────────────────────────────────────────────

    public static DataSufficiencyDto Assess(IReadOnlyList<ExpenseRecord> expenses, DateTime today, DateTime monthStart)
    {
        var count = expenses.Count;
        var historyDays = count == 0 ? 0 : (int)(today - expenses.Min(e => e.Date).Date).TotalDays + 1;
        var completeMonths = expenses.Where(e => e.Date < monthStart).Select(e => (e.Date.Year, e.Date.Month)).Distinct().Count();

        var dq = new DataSufficiencyDto
        {
            HistoryDays = historyDays,
            ExpenseTransactionCount = count,
            CompleteMonths = completeMonths,
            RequiredHistoryDays = MinHistoryDays,
            RequiredTransactions = MinTransactions,
        };

        if (historyDays < MinHistoryDays || count < MinTransactions)
        {
            var needs = new List<string>();
            if (historyDays < MinHistoryDays) needs.Add($"{MinHistoryDays - historyDays} gün daha geçmiş");
            if (count < MinTransactions) needs.Add($"{MinTransactions - count} gider kaydı daha");
            dq.Level = "insufficient";
            dq.Message = $"Güvenilir bir tahmin için {string.Join(" ve ", needs)} gerekiyor.";
        }
        else if (historyDays < GoodHistoryDays || completeMonths < 2)
        {
            dq.Level = "limited";
            dq.Message = "Veri az; tahmin geniş bir aralıkla gösteriliyor.";
        }
        else
        {
            dq.Level = "good";
            dq.Message = $"{historyDays} günlük geçmiş ve {count} gider kaydı kullanıldı.";
        }

        return dq;
    }

    private static double[] BuildDailySeries(IEnumerable<ExpenseRecord> expenses, DateTime firstDay, DateTime today)
    {
        var days = Math.Max(0, (int)(today - firstDay).TotalDays);
        var arr = new double[days];
        foreach (var e in expenses)
        {
            var idx = (int)(e.Date.Date - firstDay).TotalDays;
            if (idx >= 0 && idx < days) arr[idx] += (double)e.Amount;
        }
        return arr;
    }

    private readonly record struct SsaResult(double[] Forecast, double[] HalfWidths);

    private static SsaResult? TrySsa(double[] series, int horizon)
    {
        if (series.Length < 3 * SsaWindow || horizon <= 0) return null;
        try
        {
            var ml = new MLContext(seed: 0);
            var data = ml.Data.LoadFromEnumerable(series.Select(v => new DailyPoint { Value = (float)v }));
            var pipeline = ml.Forecasting.ForecastBySsa(
                outputColumnName: nameof(SsaOutput.Forecast),
                inputColumnName: nameof(DailyPoint.Value),
                windowSize: SsaWindow,
                seriesLength: Math.Min(series.Length, 120),
                trainSize: series.Length,
                horizon: horizon,
                confidenceLevel: 0.90f,
                confidenceLowerBoundColumn: nameof(SsaOutput.Lower),
                confidenceUpperBoundColumn: nameof(SsaOutput.Upper));
            var model = pipeline.Fit(data);
            var engine = model.CreateTimeSeriesEngine<DailyPoint, SsaOutput>(ml);
            var p = engine.Predict();
            if (p.Forecast == null || p.Forecast.Length < horizon) return null;

            var fc = p.Forecast.Select(v => Math.Max(0, (double)v)).ToArray();
            if (fc.Any(v => double.IsNaN(v) || double.IsInfinity(v))) return null;
            var hw = p.Forecast.Select((_, i) => Math.Max(0, ((double)p.Upper![i] - p.Lower![i]) / 2.0)).ToArray();
            return new SsaResult(fc, hw);
        }
        catch
        {
            return null;
        }
    }

    /// <summary>Temel model: son 8 haftada aynı haftanın günündeki ortalama harcama.</summary>
    private static double[] WeekdayBaseline(double[] series, DateTime firstDay, int horizon)
    {
        var take = Math.Min(series.Length, 56);
        var offset = series.Length - take;
        var sums = new double[7];
        var counts = new int[7];
        for (var i = offset; i < series.Length; i++)
        {
            var dow = (int)firstDay.AddDays(i).DayOfWeek;
            sums[dow] += series[i];
            counts[dow]++;
        }
        var overall = take > 0 ? series.Skip(offset).Average() : 0;
        var result = new double[horizon];
        for (var h = 0; h < horizon; h++)
        {
            var dow = (int)firstDay.AddDays(series.Length + h).DayOfWeek;
            result[h] = counts[dow] > 0 ? sums[dow] / counts[dow] : overall;
        }
        return result;
    }

    private static double ErrorPercent(decimal predicted, decimal actual) =>
        actual <= 0 ? (predicted <= 0 ? 0 : 100) : Math.Round((double)(Math.Abs(predicted - actual) / actual * 100m), 1);

    private static List<(DateTime Start, decimal Total)> CompleteMonthTotals(IReadOnlyList<ExpenseRecord> expenses, DateTime monthStart, int months)
    {
        if (expenses.Count == 0) return new();
        var first = expenses.Min(e => e.Date);
        var firstMonth = new DateTime(first.Year, first.Month, 1);
        var list = new List<(DateTime, decimal)>();
        for (var back = months; back >= 1; back--)
        {
            var s = monthStart.AddMonths(-back);
            if (s < firstMonth) continue;
            var e = s.AddMonths(1);
            list.Add((s, expenses.Where(x => x.Date >= s && x.Date < e).Sum(x => x.Amount)));
        }
        return list;
    }

    private static void AppendCurrentMonthPoint(ForecastInsightDto dto, DateTime monthStart, decimal? projected) =>
        dto.Series.Add(new ForecastSeriesPointDto
        {
            Year = monthStart.Year, Month = monthStart.Month, Label = ShortLabel(monthStart),
            Actual = dto.CurrentMonthActualToDate, Forecast = projected, Kind = "current",
        });

    private static List<CategoryDriverDto> BuildCategoryDrivers(IReadOnlyList<ExpenseRecord> expenses, DateTime monthStart)
    {
        var last3Start = monthStart.AddMonths(-3);
        var prev3Start = monthStart.AddMonths(-6);
        var last3 = expenses.Where(e => e.Date >= last3Start && e.Date < monthStart).ToList();
        var total = last3.Sum(e => e.Amount);
        if (total <= 0) return new();

        // Ortalama yalnızca kaydı olan aylara bölünür: hiç kaydın olmadığı ay 0 TL harcama sayılmaz.
        int ActiveMonths(DateTime from, DateTime to) =>
            expenses.Where(e => e.Date >= from && e.Date < to).Select(e => (e.Date.Year, e.Date.Month)).Distinct().Count();
        var recentMonths = Math.Max(1, ActiveMonths(last3Start, monthStart));
        var prevMonths = ActiveMonths(prev3Start, last3Start);

        return last3
            .GroupBy(e => e.CategoryName)
            .Select(g =>
            {
                var recentAvg = g.Sum(x => x.Amount) / recentMonths;
                var prevAvg = prevMonths == 0 ? 0m : expenses.Where(e => e.CategoryName == g.Key && e.Date >= prev3Start && e.Date < last3Start).Sum(e => e.Amount) / prevMonths;
                return new CategoryDriverDto
                {
                    CategoryName = g.Key,
                    Last3MonthAverage = Math.Round(recentAvg, 0),
                    TrendPercent = prevAvg > 0 ? Math.Round((double)((recentAvg - prevAvg) / prevAvg * 100m), 1) : null,
                    SharePercent = Math.Round((double)(g.Sum(x => x.Amount) / total * 100m), 1),
                };
            })
            .OrderByDescending(c => c.Last3MonthAverage)
            .Take(5)
            .ToList();
    }

    public static RecurringPaymentDto ToDto(RecurringPayment r) => new()
    {
        Name = r.Name,
        CategoryName = r.CategoryName,
        ExpectedAmount = Math.Round(r.ExpectedAmount, 0),
        TypicalDayOfMonth = r.TypicalDayOfMonth,
        MonthsObserved = r.MonthsObserved,
        IsSubscription = r.IsSubscription,
    };

    private static string ShortLabel(DateTime d) => d.ToString("MMM yy", Tr);

    private sealed class DailyPoint
    {
        public float Value { get; set; }
    }

    private sealed class SsaOutput
    {
        public float[]? Forecast { get; set; }
        public float[]? Lower { get; set; }
        public float[]? Upper { get; set; }
    }
}
