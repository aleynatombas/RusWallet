using System.Globalization;
using RusWallet.Core.DTOs.Finance;

namespace RusWallet.Infrastructure.Services.Insights;

/// <summary>
/// "Son 6 ay – finansal trend": aylık gelir ve gider, aydan aya değişim, en yüksek giderli ay.
/// Hiç kaydı olmayan aylar sıfır olarak değil "veri yok" olarak işaretlenir.
/// Gelecek ay tahmini ayrıca hesaplanmaz; sol sütundaki tahmin modülünün sonucu aynen kullanılır.
/// </summary>
public static class FinancialTrendEngine
{
    private static readonly CultureInfo Tr = CultureInfo.GetCultureInfo("tr-TR");
    public const int MonthsShown = 6;
    public const int MinMonthsWithData = 2;

    public static FinancialTrendInsightDto Build(
        IReadOnlyList<ExpenseRecord> expenses,
        IReadOnlyList<ExpenseRecord> incomes,
        ForecastInsightDto? forecast,
        DateTime today)
    {
        today = today.Date;
        var currentMonth = new DateTime(today.Year, today.Month, 1);
        var dto = new FinancialTrendInsightDto();
        var incomeTracked = incomes.Count > 0;

        TrendMonthDto? previous = null;
        for (var back = MonthsShown - 1; back >= 0; back--)
        {
            var m = currentMonth.AddMonths(-back);
            var isPartial = back == 0;
            var end = isPartial ? today.AddDays(1) : m.AddMonths(1);
            var exp = expenses.Where(e => e.Date >= m && e.Date < end).ToList();
            var inc = incomes.Where(e => e.Date >= m && e.Date < end).ToList();
            var hasData = exp.Count > 0 || inc.Count > 0;

            var row = new TrendMonthDto
            {
                Year = m.Year,
                Month = m.Month,
                Label = Tr.TextInfo.ToTitleCase(m.ToString("MMM", Tr)),
                IsPartial = isPartial,
                HasData = hasData,
            };
            if (hasData)
            {
                row.Expense = Math.Round(exp.Sum(e => e.Amount), 0);
                // Kullanıcı hiç gelir kaydetmiyorsa gelir "0" değil, bilinmiyor (null) olarak döner.
                if (incomeTracked)
                {
                    row.Income = Math.Round(inc.Sum(e => e.Amount), 0);
                    row.Net = row.Income - row.Expense;
                }
            }

            if (isPartial)
            {
                // Kısmi ay, geçen ayın aynı gününe kadarki dilimle kıyaslanır.
                var prevStart = m.AddMonths(-1);
                var prevEnd = prevStart.AddDays(Math.Min(today.Day, DateTime.DaysInMonth(prevStart.Year, prevStart.Month)));
                var prevSlice = expenses.Where(e => e.Date >= prevStart && e.Date < prevEnd).Sum(e => e.Amount);
                if (hasData && previous?.HasData == true && prevSlice > 0)
                    row.ExpenseChangePercent = Pct(row.Expense!.Value, prevSlice);
            }
            else if (hasData && previous?.HasData == true && previous.Expense > 0)
            {
                row.ExpenseChangePercent = Pct(row.Expense!.Value, previous.Expense.Value);
            }

            dto.Months.Add(row);
            previous = row;
        }

        var complete = dto.Months.Where(m => !m.IsPartial && m.HasData).ToList();
        dto.MonthsWithData = dto.Months.Count(m => m.HasData);
        dto.MonthsWithoutData = dto.Months.Count(m => !m.HasData);
        dto.DataQuality = new DataSufficiencyDto
        {
            CompleteMonths = complete.Count,
            ExpenseTransactionCount = expenses.Count(e => e.Date >= currentMonth.AddMonths(-(MonthsShown - 1))),
            RequiredTransactions = 0,
            HistoryDays = expenses.Count + incomes.Count == 0
                ? 0
                : (int)(today - expenses.Concat(incomes).Min(e => e.Date).Date).TotalDays + 1,
            RequiredHistoryDays = 0,
        };

        // Eğilimden söz etmek için en az iki TAMAMLANMIŞ ay gerekir; yarım ay tek başına eğilim göstermez.
        if (complete.Count < MinMonthsWithData)
        {
            dto.Status = "insufficient_data";
            dto.DataQuality.Level = "insufficient";
            dto.DataQuality.Message = dto.MonthsWithData == 0
                ? "Son 6 ayda henüz kaydın yok."
                : complete.Count == 0
                    ? "Eğilimi görmek için en az iki tamamlanmış ayın kaydı gerekiyor; şu an yalnızca bu aya ait kayıtların var."
                    : "Eğilimi görmek için en az iki tamamlanmış ayın kaydı gerekiyor; şu an bir ayın kaydı var.";
            dto.Message = dto.DataQuality.Message;
            return dto;
        }

        dto.Status = "ready";
        dto.DataQuality.Level = complete.Count >= 4 ? "good" : "limited";
        dto.DataQuality.Message = dto.MonthsWithoutData > 0
            ? $"Son 6 ayın {dto.MonthsWithoutData} ayında kayıt yok; bu aylar grafikte boş gösteriliyor."
            : "Son 6 ayın tamamında kayıt var.";

        if (complete.Count > 0)
        {
            var top = complete.OrderByDescending(m => m.Expense).First();
            dto.HighestExpenseMonthLabel = Tr.TextInfo.ToTitleCase(new DateTime(top.Year, top.Month, 1).ToString("MMMM yyyy", Tr));
            dto.HighestExpenseMonthAmount = top.Expense;
            dto.AverageMonthlyExpense = Math.Round(complete.Average(m => m.Expense ?? 0), 0);
            dto.AverageMonthlyIncome = incomeTracked ? Math.Round(complete.Average(m => m.Income ?? 0), 0) : null;
            dto.LastCompleteMonthChangePercent = dto.Months.Last(m => !m.IsPartial).ExpenseChangePercent;
        }

        if (forecast is { Status: "ready", PredictedTotal: { } p })
        {
            dto.Forecast = new TrendForecastDto
            {
                Label = Tr.TextInfo.ToTitleCase(new DateTime(forecast.TargetYear, forecast.TargetMonth, 1).ToString("MMM", Tr)),
                Expense = p,
                Lower = forecast.LowerBound,
                Upper = forecast.UpperBound,
            };
        }

        dto.Message = $"Son 6 ayın {dto.MonthsWithData} ayında kayıt var.";
        return dto;
    }

    private static double Pct(decimal current, decimal previous) =>
        Math.Round((double)((current - previous) / previous) * 100, 1);
}
