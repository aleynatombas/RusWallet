using System.Globalization;
using RusWallet.Core.DTOs.Finance;

namespace RusWallet.Infrastructure.Services.Insights;

/// <summary>
/// "Harcama alışkanlıklarım": bu ayın (bugüne kadar) gider dağılımı ve geçen ayın aynı dönemiyle kıyası.
/// Kıyas her zaman aynı gün sayısı üzerinden yapılır; ayın başında eksik ayı tam ayla karşılaştırmaz.
/// </summary>
public static class SpendingHabitsEngine
{
    private static readonly CultureInfo Tr = CultureInfo.GetCultureInfo("tr-TR");
    public const int MinMonthTransactions = 3;
    private const int MaxListedCategories = 5;

    public static SpendingHabitsInsightDto Build(IReadOnlyList<ExpenseRecord> expenses, DateTime today)
    {
        today = today.Date;
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var end = today.AddDays(1);
        var prevStart = monthStart.AddMonths(-1);
        var prevDays = Math.Min(today.Day, DateTime.DaysInMonth(prevStart.Year, prevStart.Month));
        var prevEnd = prevStart.AddDays(prevDays);

        var month = expenses.Where(e => e.Date >= monthStart && e.Date < end).ToList();
        var prev = expenses.Where(e => e.Date >= prevStart && e.Date < prevEnd).ToList();
        var hasEarlierHistory = expenses.Any(e => e.Date < monthStart);

        var dto = new SpendingHabitsInsightDto
        {
            MonthLabel = Tr.TextInfo.ToTitleCase(monthStart.ToString("MMMM", Tr)),
            PreviousPeriodLabel = prevDays == 1
                ? $"1 {prevStart.ToString("MMMM", Tr)}"
                : $"1–{prevDays} {prevStart.ToString("MMMM", Tr)}",
            TransactionCount = month.Count,
            TotalExpense = Math.Round(month.Sum(e => e.Amount), 2),
            DataQuality = new DataSufficiencyDto
            {
                ExpenseTransactionCount = month.Count,
                RequiredTransactions = MinMonthTransactions,
                HistoryDays = today.Day,
                CompleteMonths = 0,
            },
        };

        if (month.Count < MinMonthTransactions)
        {
            dto.Status = "insufficient_data";
            dto.DataQuality.Level = "insufficient";
            dto.DataQuality.Message = month.Count == 0
                ? "Bu ay henüz gider kaydın yok."
                : $"Bu ay {month.Count} gider kaydın var; dağılımı göstermek için en az {MinMonthTransactions} kayıt gerekiyor.";
            dto.Message = dto.DataQuality.Message;
            return dto;
        }

        dto.Status = "ready";
        dto.DataQuality.Level = month.Count >= 10 ? "good" : "limited";
        dto.DataQuality.Message = $"Bu ayki {month.Count} gider kaydına göre hesaplandı.";

        if (hasEarlierHistory)
        {
            dto.PreviousPeriodTotal = Math.Round(prev.Sum(e => e.Amount), 2);
            if (dto.PreviousPeriodTotal > 0)
                dto.ChangeVsPreviousPercent = Math.Round((double)((dto.TotalExpense - dto.PreviousPeriodTotal.Value) / dto.PreviousPeriodTotal.Value) * 100, 1);
        }

        var total = dto.TotalExpense;
        var prevByCat = prev.GroupBy(e => e.CategoryId).ToDictionary(g => g.Key, g => g.Sum(e => e.Amount));
        var groups = month
            .GroupBy(e => e.CategoryId)
            .Select(g => new CategoryShareDto
            {
                CategoryName = g.First().CategoryName,
                Amount = Math.Round(g.Sum(e => e.Amount), 2),
                TransactionCount = g.Count(),
                IsFixed = SpendingCategoryClassifier.IsFixedCategory(g.First().CategoryName),
                PreviousAmount = hasEarlierHistory ? Math.Round(prevByCat.GetValueOrDefault(g.Key), 2) : null,
            })
            .OrderByDescending(c => c.Amount)
            .ToList();

        foreach (var c in groups)
        {
            c.SharePercent = total > 0 ? Math.Round((double)(c.Amount / total) * 100, 1) : 0;
            if (c.PreviousAmount is > 0)
                c.ChangePercent = Math.Round((double)((c.Amount - c.PreviousAmount.Value) / c.PreviousAmount.Value) * 100, 1);
        }

        var listed = groups.Take(MaxListedCategories).ToList();
        var rest = groups.Skip(MaxListedCategories).ToList();
        if (rest.Count > 0)
        {
            var amount = rest.Sum(c => c.Amount);
            var prevAmount = hasEarlierHistory ? rest.Sum(c => c.PreviousAmount ?? 0) : (decimal?)null;
            listed.Add(new CategoryShareDto
            {
                CategoryName = $"Diğer ({rest.Count} kategori)",
                Amount = amount,
                SharePercent = total > 0 ? Math.Round((double)(amount / total) * 100, 1) : 0,
                TransactionCount = rest.Sum(c => c.TransactionCount),
                PreviousAmount = prevAmount,
                ChangePercent = prevAmount is > 0 ? Math.Round((double)((amount - prevAmount.Value) / prevAmount.Value) * 100, 1) : null,
                IsOther = true,
            });
        }

        dto.Categories = listed;
        dto.FixedSharePercent = total > 0 ? Math.Round((double)(groups.Where(c => c.IsFixed).Sum(c => c.Amount) / total) * 100, 1) : 0;
        dto.Message = $"{dto.MonthLabel} ayında {groups.Count} kategoride harcama yaptın.";
        return dto;
    }
}
