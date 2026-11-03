using RusWallet.Core.DTOs.Finance;
using RusWallet.Infrastructure.Services.Insights;
using static RusWallet.Tests.SyntheticData;

namespace RusWallet.Tests;

public class SpendingHabitsEngineTests
{
    [Fact]
    public void Shares_add_up_and_compare_with_same_period_of_last_month()
    {
        var data = Build();
        var dto = SpendingHabitsEngine.Build(data, Today);

        Assert.Equal("ready", dto.Status);
        var monthStart = new DateTime(Today.Year, Today.Month, 1);
        var expectedTotal = data.Where(e => e.Date >= monthStart && e.Date <= Today).Sum(e => e.Amount);
        Assert.Equal(Math.Round(expectedTotal, 2), dto.TotalExpense);
        Assert.InRange(dto.Categories.Sum(c => c.SharePercent), 99.5, 100.5);
        Assert.Equal(dto.TotalExpense, dto.Categories.Sum(c => c.Amount));

        // Kıyas dönemi: geçen ayın 1–15'i (tam ay değil).
        var prevStart = monthStart.AddMonths(-1);
        var prevSlice = data.Where(e => e.Date >= prevStart && e.Date < prevStart.AddDays(Today.Day)).Sum(e => e.Amount);
        Assert.Equal(Math.Round(prevSlice, 2), dto.PreviousPeriodTotal);
        Assert.Equal("Kira", dto.Categories[0].CategoryName);
        Assert.True(dto.Categories[0].IsFixed);
    }

    [Fact]
    public void Does_not_invent_percentages_with_too_few_records()
    {
        var monthStart = new DateTime(Today.Year, Today.Month, 1);
        var data = Build().Where(e => e.Date < monthStart).ToList();
        data.Add(new ExpenseRecord(NextId(data), Today, 120, Market, "Market", "Migros"));

        var dto = SpendingHabitsEngine.Build(data, Today);

        Assert.Equal("insufficient_data", dto.Status);
        Assert.Empty(dto.Categories);
        Assert.Equal(1, dto.DataQuality.ExpenseTransactionCount);
    }

    [Fact]
    public void New_user_has_no_previous_period_comparison()
    {
        var monthStart = new DateTime(Today.Year, Today.Month, 1);
        var data = Build().Where(e => e.Date >= monthStart).ToList();

        var dto = SpendingHabitsEngine.Build(data, Today);

        Assert.Equal("ready", dto.Status);
        Assert.Null(dto.PreviousPeriodTotal);
        Assert.Null(dto.ChangeVsPreviousPercent);
        Assert.All(dto.Categories, c => Assert.Null(c.ChangePercent));
    }
}

public class FinancialTrendEngineTests
{
    private static List<ExpenseRecord> Salaries(int months, params int[] skipMonthsBack)
    {
        var list = new List<ExpenseRecord>();
        var current = new DateTime(Today.Year, Today.Month, 1);
        for (var back = months - 1; back >= 0; back--)
        {
            if (skipMonthsBack.Contains(back)) continue;
            list.Add(new ExpenseRecord(100_000 + back, current.AddMonths(-back).AddDays(4), 40000, 99, "Maaş", "Maaş"));
        }
        return list;
    }

    [Fact]
    public void Months_without_any_record_are_marked_as_no_data_not_zero()
    {
        var current = new DateTime(Today.Year, Today.Month, 1);
        // İki ay önce hiç kayıt yok.
        var gap = current.AddMonths(-2);
        var expenses = Build().Where(e => e.Date < gap || e.Date >= gap.AddMonths(1)).ToList();
        var incomes = Salaries(6, skipMonthsBack: 2);

        var dto = FinancialTrendEngine.Build(expenses, incomes, null, Today);

        Assert.Equal("ready", dto.Status);
        Assert.Equal(6, dto.Months.Count);
        var gapRow = dto.Months.Single(m => m.Year == gap.Year && m.Month == gap.Month);
        Assert.False(gapRow.HasData);
        Assert.Null(gapRow.Expense);
        Assert.Null(gapRow.Income);
        // Boş aydan sonraki ay için aylık değişim hesaplanmaz.
        Assert.Null(dto.Months[dto.Months.IndexOf(gapRow) + 1].ExpenseChangePercent);
        Assert.Equal(1, dto.MonthsWithoutData);
        Assert.True(dto.Months[^1].IsPartial);
    }

    [Fact]
    public void Uses_the_same_forecast_number_as_the_forecast_module()
    {
        var expenses = Build();
        var forecast = SpendingForecastEngine.Build(expenses, RecurringPaymentDetector.Detect(expenses, Today), Today);
        Assert.Equal("ready", forecast.Status);

        var dto = FinancialTrendEngine.Build(expenses, Salaries(6), forecast, Today);

        Assert.NotNull(dto.Forecast);
        Assert.Equal(forecast.PredictedTotal, dto.Forecast!.Expense);
        Assert.Equal(forecast.LowerBound, dto.Forecast.Lower);
        Assert.NotNull(dto.HighestExpenseMonthLabel);
        Assert.Equal(dto.Months.Where(m => !m.IsPartial && m.HasData).Max(m => m.Expense), dto.HighestExpenseMonthAmount);
    }

    [Fact]
    public void Income_is_unknown_not_zero_when_user_never_records_income()
    {
        var dto = FinancialTrendEngine.Build(Build(), new List<ExpenseRecord>(), null, Today);

        Assert.Equal("ready", dto.Status);
        Assert.All(dto.Months, m => Assert.Null(m.Income));
        Assert.All(dto.Months, m => Assert.Null(m.Net));
        Assert.Null(dto.AverageMonthlyIncome);
    }

    [Fact]
    public void Needs_at_least_two_months_with_records()
    {
        var current = new DateTime(Today.Year, Today.Month, 1);
        var expenses = Build().Where(e => e.Date >= current).ToList();

        var dto = FinancialTrendEngine.Build(expenses, new List<ExpenseRecord>(), null, Today);

        Assert.Equal("insufficient_data", dto.Status);
        Assert.Null(dto.Forecast);

        // Bir tamamlanmış ay + yarım ay da eğilim sayılmaz.
        var prev = current.AddMonths(-1);
        var oneAndPartial = Build().Where(e => e.Date >= prev).ToList();
        Assert.Equal("insufficient_data", FinancialTrendEngine.Build(oneAndPartial, new List<ExpenseRecord>(), null, Today).Status);
    }

    [Fact]
    public void Partial_month_change_uses_same_day_slice_of_previous_month()
    {
        var expenses = Build();
        var dto = FinancialTrendEngine.Build(expenses, Salaries(6), null, Today);

        var current = new DateTime(Today.Year, Today.Month, 1);
        var prevStart = current.AddMonths(-1);
        var prevSlice = expenses.Where(e => e.Date >= prevStart && e.Date < prevStart.AddDays(Today.Day)).Sum(e => e.Amount);
        var mtd = Math.Round(expenses.Where(e => e.Date >= current).Sum(e => e.Amount), 0);
        var expected = Math.Round((double)((mtd - prevSlice) / prevSlice) * 100, 1);
        Assert.Equal(expected, dto.Months[^1].ExpenseChangePercent);
    }
}

public class DashboardNarrativeTests
{
    [Fact]
    public async Task Rule_based_commentaries_contain_no_digits()
    {
        var svc = new RuleBasedFinanceNarrativeService();
        var result = await svc.GenerateAsync(new RusWallet.Core.Interfaces.FinanceNarrativeRequest
        {
            Habits = new() { MonthName = "Kasım", TopCategory = "Kira", TopCategoryWeight = "dominant", TotalDirection = "up", RisingCategories = { "Restoran" }, FixedShareBand = "high" },
            Trend = new() { LastMonthDirection = "down", IncomeRecorded = true, MonthsExpenseAboveIncome = 1, CompleteMonthsWithData = 5, ForecastVsAverage = "above" },
        });

        Assert.True(SmartInsightsService.IsClean(result.HabitsCommentary));
        Assert.True(SmartInsightsService.IsClean(result.TrendCommentary));
    }
}

public class DeterminismTests
{
    [Fact]
    public void Savings_amounts_are_identical_across_repeated_runs()
    {
        var data = Build(restaurantTrendUp: true);
        var recurring = RecurringPaymentDetector.Detect(data, Today);
        var first = SavingsOpportunityEngine.Build(data, recurring, Today).TotalMonthlyPotential;
        for (var i = 0; i < 5; i++)
        {
            // Araya başka ML çağrıları girse de sonuç değişmemeli.
            RusWallet.Infrastructure.Services.MlNetForecastService.PredictNextMonth(new List<decimal> { 1, 5, 2, 8 });
            Assert.Equal(first, SavingsOpportunityEngine.Build(data, recurring, Today).TotalMonthlyPotential);
        }
    }
}

public class CategoryDriverGapTests
{
    [Fact]
    public void Empty_month_does_not_look_like_a_drop_in_rent()
    {
        var current = new DateTime(Today.Year, Today.Month, 1);
        var gap = current.AddMonths(-2);
        var data = Build().Where(e => e.Date < gap || e.Date >= gap.AddMonths(1)).ToList();

        var dto = SpendingForecastEngine.Build(data, RecurringPaymentDetector.Detect(data, Today), Today);

        var rent = dto.CategoryDrivers.Single(c => c.CategoryName == "Kira");
        Assert.Equal(15000, rent.Last3MonthAverage);
        Assert.InRange(rent.TrendPercent ?? 0, -1, 1);
    }
}
