using RusWallet.Infrastructure.Services.Insights;
using static RusWallet.Tests.SyntheticData;

namespace RusWallet.Tests;

public class RecurringPaymentDetectorTests
{
    [Fact]
    public void Detects_rent_and_subscriptions_but_not_groceries()
    {
        var recurring = RecurringPaymentDetector.Detect(Build(), Today);

        Assert.Contains(recurring, r => r.CategoryId == Kira && r.ExpectedAmount == 15000 && r.IsActive);
        Assert.Contains(recurring, r => r.Name == "Netflix" && r.IsSubscription);
        Assert.Contains(recurring, r => r.Name == "Spotify" && r.IsSubscription);
        Assert.DoesNotContain(recurring, r => r.CategoryId == Market);
        Assert.DoesNotContain(recurring, r => r.CategoryId == Restoran);
    }
}

public class SpendingForecastEngineTests
{
    [Fact]
    public void Reports_insufficient_data_instead_of_a_fake_forecast()
    {
        var shortHistory = Build().Where(e => e.Date >= Today.AddDays(-20)).ToList();
        var dto = SpendingForecastEngine.Build(shortHistory, RecurringPaymentDetector.Detect(shortHistory, Today), Today);

        Assert.Equal("insufficient_data", dto.Status);
        Assert.Null(dto.PredictedTotal);
        Assert.Equal("insufficient", dto.DataQuality.Level);
        Assert.False(string.IsNullOrWhiteSpace(dto.DataQuality.Message));
    }

    [Fact]
    public void Forecast_is_close_to_typical_month_and_inside_its_interval()
    {
        var data = Build();
        var recurring = RecurringPaymentDetector.Detect(data, Today);
        var dto = SpendingForecastEngine.Build(data, recurring, Today);

        Assert.Equal("ready", dto.Status);
        Assert.Equal("good", dto.DataQuality.Level);
        Assert.NotNull(dto.PredictedTotal);
        Assert.InRange(dto.LowerBound!.Value, 0, dto.PredictedTotal!.Value);
        Assert.True(dto.UpperBound >= dto.PredictedTotal);

        // Gerçek tipik ay: son 3 tam ayın ortalaması
        var monthStart = new DateTime(Today.Year, Today.Month, 1);
        var typical = Enumerable.Range(1, 3)
            .Select(b => data.Where(e => e.Date >= monthStart.AddMonths(-b) && e.Date < monthStart.AddMonths(-b + 1)).Sum(e => e.Amount))
            .Average();
        Assert.InRange(dto.PredictedTotal.Value, typical * 0.8m, typical * 1.2m);

        // Düzenli ödeme bileşeni: kira + Netflix + Spotify
        Assert.InRange(dto.RecurringComponent, 15280m, 15300m);
        Assert.NotNull(dto.Backtest);
        Assert.NotNull(dto.Backtest!.SsaPredictedTotal); // ML.NET SSA gerçekten çalıştı (sessizce düşmedi)
        Assert.Contains(dto.Method, new[] { "ssa", "seasonal_baseline" });
        Assert.Contains(dto.Series, p => p.Kind == "forecast");
        Assert.NotNull(dto.ChangeVsLastMonthPercent);
    }
}

public class AnomalyDetectionEngineTests
{
    [Fact]
    public void Flags_an_unusually_large_grocery_purchase()
    {
        var data = Build();
        var spikeId = NextId(data);
        data.Add(new ExpenseRecord(spikeId, Today.AddDays(-3), 4800, Market, "Market", "Migros toplu alışveriş"));

        var dto = AnomalyDetectionEngine.Detect(data, RecurringPaymentDetector.Detect(data, Today), new HashSet<string>(), Today);

        Assert.Equal("ready", dto.Status);
        var hit = Assert.Single(dto.Items, i => i.Key == $"tx:{spikeId}");
        Assert.Equal("unusual_transaction", hit.Type);
        Assert.True(hit.DeviationPercent > 500);
        Assert.Contains(hit.DetectionMethods, m => m.StartsWith("ML.NET"));
        Assert.Contains("Dayanıklı z-skoru", hit.DetectionMethods);
    }

    [Fact]
    public void Does_not_flag_rent_or_normal_spending()
    {
        var data = Build();
        var dto = AnomalyDetectionEngine.Detect(data, RecurringPaymentDetector.Detect(data, Today), new HashSet<string>(), Today);

        Assert.Equal("ready", dto.Status);
        Assert.DoesNotContain(dto.Items, i => i.CategoryId == Kira || i.CategoryId == Abonelik);
        Assert.DoesNotContain(dto.Items, i => i.Type == "unusual_transaction");
        Assert.True(dto.ExcludedRecurringCount > 0);
    }

    [Fact]
    public void Requires_enough_history()
    {
        var data = Build().Where(e => e.Date >= Today.AddDays(-25)).ToList();
        var dto = AnomalyDetectionEngine.Detect(data, new List<RecurringPayment>(), new HashSet<string>(), Today);
        Assert.Equal("insufficient_data", dto.Status);
        Assert.Empty(dto.Items);
    }
}

public class SavingsOpportunityEngineTests
{
    [Fact]
    public void Finds_restaurant_increase_and_subscription_price_increase()
    {
        var data = Build(restaurantTrendUp: true, spotifyPriceIncrease: true);
        var dto = SavingsOpportunityEngine.Build(data, RecurringPaymentDetector.Detect(data, Today), Today);

        Assert.Equal("ready", dto.Status);
        var rest = Assert.Single(dto.Opportunities, o => o.Kind == "category_reduction" && o.CategoryName == "Restoran");
        Assert.Contains("trend_up", rest.ReasonCodes);
        Assert.True(rest.MonthlySaving > 0);
        Assert.True(rest.MonthlySaving <= rest.CurrentLevel * 0.30m);
        Assert.True(rest.TargetLevel < rest.CurrentLevel);

        var sub = Assert.Single(dto.Opportunities, o => o.Kind == "subscription_price_increase");
        Assert.Equal(40m, sub.MonthlySaving);

        Assert.Equal(dto.Opportunities.Sum(o => o.MonthlySaving), dto.TotalMonthlyPotential);
        Assert.Equal(dto.Opportunities.OrderByDescending(o => o.PriorityScore).Select(o => o.Id), dto.Opportunities.Select(o => o.Id));
        Assert.DoesNotContain(dto.Opportunities, o => o.CategoryName == "Kira");
    }

    [Fact]
    public void Requires_three_complete_months()
    {
        var data = Build(months: 2);
        var dto = SavingsOpportunityEngine.Build(data, RecurringPaymentDetector.Detect(data, Today), Today);
        Assert.Equal("insufficient_data", dto.Status);
        Assert.Empty(dto.Opportunities);
    }
}

public class NarrativeGuardTests
{
    [Theory]
    [InlineData("Restoran harcamanı tipik seviyene çekebilirsin.", true)]
    [InlineData("Ayda 450 TL tasarruf edebilirsin.", false)]
    [InlineData("%20 azalt", false)]
    [InlineData("", false)]
    public void Ai_text_with_numbers_is_rejected(string text, bool expected) =>
        Assert.Equal(expected, SmartInsightsService.IsClean(text));
}

public class ForecastDiagnostics
{
    private readonly Xunit.Abstractions.ITestOutputHelper _out;
    public ForecastDiagnostics(Xunit.Abstractions.ITestOutputHelper output) => _out = output;

    /// <summary>Model seçimini ve backtest hatalarını test çıktısına yazar (raporlama için).</summary>
    [Fact]
    public void Print_model_selection()
    {
        var data = Build();
        var dto = SpendingForecastEngine.Build(data, RecurringPaymentDetector.Detect(data, Today), Today);
        var b = dto.Backtest!;
        _out.WriteLine($"method={dto.Method} pred={dto.PredictedTotal} [{dto.LowerBound}-{dto.UpperBound}] recurring={dto.RecurringComponent} " +
                       $"backtest actual={b.ActualTotal} ssa={b.SsaPredictedTotal} ({b.SsaErrorPercent}%) base={b.BaselinePredictedTotal} ({b.BaselineErrorPercent}%)");
        Assert.True(dto.PredictedTotal > 0);
    }
}
