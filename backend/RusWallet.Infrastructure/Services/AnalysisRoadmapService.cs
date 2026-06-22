using System.Globalization;
using RusWallet.Core.DTOs.Finance;
using RusWallet.Core.Entities;
using RusWallet.Core.Interfaces;

namespace RusWallet.Infrastructure.Services;

public sealed class AnalysisRoadmapService : IAnalysisRoadmapService
{
    private static readonly CultureInfo Tr = CultureInfo.GetCultureInfo("tr-TR");

    private readonly ITransactionRepository _transactions;
    private readonly IUserRepository _users;
    private readonly IMonthEndPredictiveService _monthEndPredictive;
    private readonly ICockpitMonthEndInsightService _cockpitInsight;

    public AnalysisRoadmapService(
        ITransactionRepository transactions,
        IUserRepository users,
        IMonthEndPredictiveService monthEndPredictive,
        ICockpitMonthEndInsightService cockpitInsight)
    {
        _transactions = transactions;
        _users = users;
        _monthEndPredictive = monthEndPredictive;
        _cockpitInsight = cockpitInsight;
    }

    public async Task<FinancialRoadmapResponseDto> GetRoadmapAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await _users.GetByIdAsync(userId);
        var today = DateTime.Today;
        var horizonEnd = today.AddDays(1);

        var expenses = await _transactions.GetByUserAndDateRangeAsync(userId, today.AddMonths(-7), horizonEnd, false);

        var roadmap = new FinancialRoadmapResponseDto
        {
            InsightCards = new List<InsightCardDto>(),
            Cockpit = await BuildFinancialCockpitAsync(expenses, today, user, cancellationToken),
            Lifestyle = BuildLifestyle(expenses, today),
            CashFlow = BuildCashFlow(expenses, today, user),
            QaModule = BuildQa(expenses, today),
            MonthSpendSparkline = BuildMonthSpendSparkline(expenses, today),
        };

        return roadmap;
    }

    private static string CatName(Transaction t) =>
        t.Category?.Name?.Trim() ?? "Kategorisiz";

    private static string Norm(string s) => s.ToLower(Tr);

    private static bool IsMandatoryCategory(string name)
    {
        var n = Norm(name);
        foreach (var k in MandatoryKeys)
        {
            if (n.Contains(k, StringComparison.Ordinal)) return true;
        }
        return false;
    }

    private static readonly string[] MandatoryKeys =
    {
        "kira", "konut", "mortgage", "depozito", "aidat", "yönetim", "yonetim", "apartman",
        "fatura", "elektrik", "su ", " su", "şebeke", "sebeke", "doğalgaz", "dogalgaz", "ısıtma", "isitma", "kombi",
        "internet", "telefon", "adsl", "fiber", "vodafone", "turkcell", "türkcell", "türk telekom", "turk telekom",
        "superonline", "ttnet", "millenicom",
        "ulaşım", "ulasim", "otopark", "toplu taşıma", "toplu tasima", "metro", "marmaray",
        "vergi", "sigorta", "dask", "kasko", "kredi", "banka", "taksit", "leasing",
        "okul", "kreş", "kres", "anaokulu", "üniversite", "universite", "dershane",
        "güvenlik", "guvenlik", "emlak", "yurt",
    };

    private static readonly string[] SubscriptionHintKeys =
    {
        "abonelik", "üyelik", "uyelik",
        "netflix", "spotify", "youtube premium", "youtube müzik", "youtube muzik", "apple tv", "apple music", "apple one",
        "disney", "prime video", "amazon prime", "exxen", "blutv", "gain", "bein", "tivibu", "dsmart", "d-smart",
        "microsoft 365", "office 365", "google one", "adobe", "dropbox", "icloud", "chatgpt", "openai", "cursor",
        "playstation", "xbox", "steam", "epic games",
        "gym", "fitness", "spor salonu", "wellness",
    };

    private static bool IsSubscriptionCategory(string name)
    {
        var n = Norm(name);
        foreach (var k in SubscriptionHintKeys)
        {
            if (n.Contains(k, StringComparison.Ordinal)) return true;
        }

        return false;
    }

    private static bool IsDiningOutCategory(string name)
    {
        var n = Norm(name);
        return n.Contains("restoran", StringComparison.Ordinal) || n.Contains("dışarı", StringComparison.Ordinal)
               || n.Contains("disari", StringComparison.Ordinal) || n.Contains("yemek", StringComparison.Ordinal)
               || n.Contains("cafe", StringComparison.Ordinal) || n.Contains("kahve", StringComparison.Ordinal)
               || n.Contains("fast", StringComparison.Ordinal);
    }

    private static bool IsBillCategory(string name)
    {
        var n = Norm(name);
        var waterBill = n.Contains("su", StringComparison.Ordinal) &&
                        (n.Contains("fatura", StringComparison.Ordinal) || n.Contains("doğa", StringComparison.Ordinal) ||
                         n.Contains("doga", StringComparison.Ordinal));
        return n.Contains("fatura", StringComparison.Ordinal) || n.Contains("elektrik", StringComparison.Ordinal) || waterBill
               || n.Contains("doğalgaz", StringComparison.Ordinal) || n.Contains("dogalgaz", StringComparison.Ordinal)
               || n.Contains("internet", StringComparison.Ordinal) || n.Contains("telefon", StringComparison.Ordinal)
               || n.Contains("ısıtma", StringComparison.Ordinal) || n.Contains("isitma", StringComparison.Ordinal)
               || n.Contains("kombi", StringComparison.Ordinal) || n.Contains("şebeke", StringComparison.Ordinal)
               || n.Contains("sebeke", StringComparison.Ordinal);
    }

    /// <summary>Kira, fatura, abonelik vb. ayda genelde tek/öngörülebilir ödeme olarak işlenen kategoriler.</summary>
    private static bool IsFixedMonthlyCategory(string name) =>
        IsMandatoryCategory(name) || IsSubscriptionCategory(name) || IsBillCategory(name);

    /// <summary>Kokpit üçlüsü. <see cref="MonthEndExpectationCockpitDto.InsightStack"/> = predictive (ML + AI).</summary>
    private async Task<FinancialCockpitDto> BuildFinancialCockpitAsync(
        List<Transaction> expenses,
        DateTime today,
        User? user,
        CancellationToken cancellationToken)
    {
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var prevMonthStart = monthStart.AddMonths(-1);
        var prevMonthEnd = monthStart;
        var dayInMonth = today.Day;
        var prevSliceEnd = prevMonthStart.AddDays(Math.Min(dayInMonth, DateTime.DaysInMonth(prevMonthStart.Year, prevMonthStart.Month)) - 1).AddDays(1);
        var dim = DateTime.DaysInMonth(today.Year, today.Month);
        var daysRemaining = Math.Max(0, dim - today.Day);

        bool IsFlexibleSpend(Transaction t) => !IsFixedMonthlyCategory(CatName(t));

        var prediction = _monthEndPredictive.Predict(expenses, today, user, IsFlexibleSpend);
        var previousMonthTotal = expenses
            .Where(t => !t.IsIncome && t.TransactionDate >= prevMonthStart && t.TransactionDate < prevMonthEnd)
            .Sum(t => t.Amount);

        var last3MonthsTotals = Enumerable.Range(1, 3)
            .Select(back =>
            {
                var start = monthStart.AddMonths(-back);
                var end = start.AddMonths(1);
                return expenses
                    .Where(t => !t.IsIncome && t.TransactionDate >= start && t.TransactionDate < end)
                    .Sum(t => t.Amount);
            })
            .ToList();
        var last3MonthsAverage = last3MonthsTotals.Count > 0 ? last3MonthsTotals.Average() : 0m;

        var monthEnd = new MonthEndExpectationCockpitDto
        {
            CurrentMonthSpentMtd = prediction.CurrentMonthSpentMtd,
            CurrentMonthDay = prediction.CurrentMonthDay,
            DaysInMonth = prediction.DaysInMonth,
            DailyAverageSpend = prediction.DailyAverageSpend,
            ProjectedMonthTotal = prediction.ProjectedMonthTotal,
            DaysRemainingInMonth = daysRemaining,
            BudgetFillPercent = prediction.BudgetFillPercent,
            IsOverPaceVersusDisposable = prediction.IsOverPaceVersusDisposable,
            HasDisposableReference = prediction.HasDisposableReference,
            ProjectedUsesFixedPlusFlexibleSplit = prediction.ProjectedUsesFixedPlusFlexibleSplit,
            ShortMessage = prediction.ForecastExplanation,
            ForecastDisclaimer = prediction.ForecastDisclaimer,
            ActionChatMessage = "Bu ayki harcama temposuna göre gelecek ay tahminini detaylandır.",
            InsightStack = "predictive_analysis",
            ForecastNextMonthTotal = prediction.ForecastNextMonthTotal,
            PreviousMonthTotal = previousMonthTotal > 0 ? Math.Round(previousMonthTotal, 0) : null,
            Last3MonthsAverageTotal = last3MonthsAverage > 0 ? Math.Round(last3MonthsAverage, 0) : null,
            PredictionSource = prediction.PredictionSource,
            PredictionConfidencePercent = prediction.PredictionConfidencePercent,
        };

        // Radar — son 3 gün, kategori ortalamasının üzerinde uç işlem
        var recent = expenses
            .Where(t => (today - t.TransactionDate.Date).TotalDays <= 3 && t.TransactionDate <= today && IsFlexibleSpend(t))
            .ToList();
        var hits = new List<RadarHitItemDto>();
        var radarLowData = false;

        foreach (var g in recent.GroupBy(t => CatName(t)))
        {
            var name = g.Key;
            var hist = expenses.Where(t => CatName(t) == name && t.TransactionDate < monthStart && IsFlexibleSpend(t)).Select(t => t.Amount).ToList();
            if (hist.Count < 3) continue;
            var mean = (double)hist.Average(x => (double)x);
            var std = StdDev(hist.Select(x => (double)x).ToList());
            foreach (var tx in g.OrderByDescending(t => t.Amount))
            {
                if (mean <= 0) continue;
                var ratio = (double)tx.Amount / mean;
                if (ratio >= 3 && (std <= 0 || (double)tx.Amount > mean + 2 * std))
                {
                    hits.Add(new RadarHitItemDto
                    {
                        CategoryLabel = name,
                        Amount = tx.Amount,
                        IsUnusual = true,
                    });
                    break;
                }
            }
            if (hits.Count > 0) break;
        }

        if (recent.Count > 0)
        {
            var anyHist = recent
                .GroupBy(t => CatName(t))
                .Any(g => expenses.Count(t => CatName(t) == g.Key && t.TransactionDate < monthStart && IsFlexibleSpend(t)) >= 3);
            radarLowData = !anyHist;
        }

        var radar = new RadarHitsCockpitDto
        {
            IsLowData = radarLowData && hits.Count == 0,
            HasUnusualSpending = hits.Count > 0,
            Hits = hits,
            ShortMessage = hits.Count > 0
                ? "Son işlemlerde dikkat çeken bir kalem var."
                : "Son 3 günde alışılmışın dışında bir harcama yok.",
            ActionChatMessage = "Bu ay harcamalarımda olağandışı veya tekrar eden riskli kalemler var mı, özetle.",
            InsightStack = "ml_anomaly",
        };

        if (hits.Count > 0 && hits[0] is { } h)
        {
            radar.ShortMessage = $"{h.CategoryLabel}: sıradışı tutar.";
        }
        else if (radar.IsLowData)
        {
            radar.ShortMessage = "Esnek harcama verisi arttıkça radar daha hassas çalışır.";
        }

        if (hits.Count == 0)
        {
            var topMonth = expenses
                .Where(t => t.TransactionDate >= monthStart && t.TransactionDate < today.AddDays(1) && !t.IsIncome && IsFlexibleSpend(t))
                .GroupBy(t => CatName(t))
                .Select(g => (Name: g.Key, Sum: g.Sum(x => x.Amount)))
                .OrderByDescending(x => x.Sum)
                .FirstOrDefault();
            if (topMonth.Sum > 0)
            {
                radar.TopMonthCategoryLabel = topMonth.Name;
                radar.TopMonthCategoryAmount = topMonth.Sum;
            }
        }

        // Fırsatlar — ML.NET + son 6 ay kategori analizi.
        var tiles = new List<OpportunityTileDto>();
        var isLearning = true;
        var oppShort = "Henüz bu dönem için belirgin bir tasarruf sinyali yok; işlem ve dönem verisi arttıkça kıyaslama netleşir.";
        var oppChat = "Son 6 ay harcamama göre en yüksek tasarruf etkili ilk 3 öneriyi çıkar.";

        var analysisStart = monthStart.AddMonths(-5);
        var analysisEnd = today.AddDays(1);

        var sixMonthTx = expenses
            .Where(t => !t.IsIncome && t.TransactionDate >= analysisStart && t.TransactionDate < analysisEnd && IsFlexibleSpend(t))
            .ToList();

        var monthKeys = Enumerable.Range(0, 6)
            .Select(i => monthStart.AddMonths(-5 + i))
            .Select(m => $"{m.Year:D4}-{m.Month:D2}")
            .ToList();

        var monthlyTotals = sixMonthTx
            .GroupBy(t => new { t.TransactionDate.Year, t.TransactionDate.Month })
            .ToDictionary(g => $"{g.Key.Year:D4}-{g.Key.Month:D2}", g => g.Sum(x => x.Amount));

        var monthSeries = monthKeys
            .Select(k => monthlyTotals.TryGetValue(k, out var s) ? s : 0m)
            .ToList();

        var avgMonthlySpend = monthSeries.Count > 0 ? monthSeries.Average() : 0m;

        var categorySeries = sixMonthTx
            .GroupBy(t => CatName(t))
            .Select(g =>
            {
                var perMonth = g
                    .GroupBy(x => new { x.TransactionDate.Year, x.TransactionDate.Month })
                    .ToDictionary(m => $"{m.Key.Year:D4}-{m.Key.Month:D2}", m => m.Sum(x => x.Amount));

                var series = monthKeys
                    .Select(k => perMonth.TryGetValue(k, out var s) ? s : 0m)
                    .ToList();

                var monthlyAvg = series.Average();
                var mlForecast = series.Count(v => v > 0) >= 2
                    ? MlNetForecastService.PredictNextMonth(series) ?? MLPredictionHelper.PredictNextByLinearRegression(series)
                    : (decimal?)null;

                var baseSpend = mlForecast is > 0
                    ? Math.Round(mlForecast.Value * 0.6m + monthlyAvg * 0.4m, 0)
                    : Math.Round(monthlyAvg, 0);

                var overRatio = avgMonthlySpend > 0 ? monthlyAvg / avgMonthlySpend : 0;
                var reducePercent = Math.Clamp(10m + (overRatio - 1.2m) * 8m, 10m, 15m);
                var monthlySave = Math.Round(baseSpend * reducePercent / 100m, 0);

                return new
                {
                    Category = g.Key,
                    MonthlyAverage = Math.Round(monthlyAvg, 0),
                    BaseSpend = baseSpend,
                    OverRatio = overRatio,
                    ReducePercent = reducePercent,
                    MonthlySave = monthlySave,
                    YearlySave = Math.Round(monthlySave * 12m, 0),
                };
            })
            .Where(x => x.MonthlyAverage > 0 && avgMonthlySpend > 0 && x.OverRatio >= 1.2m)
            .OrderByDescending(x => x.MonthlySave)
            .ThenByDescending(x => x.OverRatio)
            .Take(3)
            .ToList();

        foreach (var rec in categorySeries)
        {
            tiles.Add(new OpportunityTileDto
            {
                IconEmoji = "",
                Label = rec.Category,
                Subtitle =
                    $"Son 6 ayda {rec.Category} kategorisine ayda ortalama {rec.MonthlyAverage.ToString("N0", Tr)} TL harcadın. " +
                    $"Bu harcamayı %{rec.ReducePercent:F0} azaltırsan ayda yaklaşık {rec.MonthlySave.ToString("N0", Tr)} TL, " +
                    $"yılda {rec.YearlySave.ToString("N0", Tr)} TL tasarruf edebilirsin.",
                EstimatedSaving = rec.MonthlySave > 0 ? rec.MonthlySave : null,
            });
        }

        if (tiles.Count > 0)
        {
            isLearning = false;
            oppShort = "Öneriler potansiyel aylık tasarruf etkisine göre önem sırasıyla listelendi; en yüksek getirili ilk 3 fırsat gösteriliyor.";
            oppChat = "Bu 3 öneri için uygulanabilir haftalık azaltım planı ve alternatif senaryolar üret.";
        }
        else
        {
            var topCategory = sixMonthTx
                .GroupBy(t => CatName(t))
                .Select(g => new { Category = g.Key, Sum = g.Sum(x => x.Amount) })
                .OrderByDescending(x => x.Sum)
                .FirstOrDefault();

            if (topCategory is not null && topCategory.Sum > 0)
            {
                var monthlyAvgTop = Math.Round(topCategory.Sum / 6m, 0);
                var monthlySaveTop = Math.Round(monthlyAvgTop * 0.10m, 0);
                var yearlySaveTop = Math.Round(monthlySaveTop * 12m, 0);

                isLearning = false;
                oppShort = "Bu ay %20 eşiğini aşan kategori çıkmadı; yine de en yüksek kalemde kontrollü azaltım fırsatı var.";
                oppChat = $"{topCategory.Category} kategorisinde %10 azaltım için uygulanabilir bir plan hazırla.";

                tiles.Add(new OpportunityTileDto
                {
                    IconEmoji = "",
                    Label = topCategory.Category,
                    Subtitle =
                        $"Son 6 ay verisine göre {topCategory.Category} kategorisi en yüksek kalemlerden biri. " +
                        $"%10 azaltım ile ayda yaklaşık {monthlySaveTop.ToString("N0", Tr)} TL, yılda {yearlySaveTop.ToString("N0", Tr)} TL tasarruf edebilirsin.",
                    EstimatedSaving = monthlySaveTop > 0 ? monthlySaveTop : null,
                });
            }
        }

        var opportunities = new OpportunityCornerCockpitDto
        {
            IsLearning = isLearning,
            Tiles = tiles,
            ShortMessage = oppShort,
            ActionChatMessage = oppChat,
            InsightStack = "ml_opportunity",
        };

        return new FinancialCockpitDto
        {
            MonthEnd = monthEnd,
            Radar = radar,
            Opportunities = opportunities,
        };
    }

    private LifestyleProfileDto? BuildLifestyle(List<Transaction> expenses, DateTime today)
    {
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var monthExp = expenses.Where(t => t.TransactionDate >= monthStart && t.TransactionDate < today.AddDays(1) && !t.IsIncome).ToList();
        if (monthExp.Count == 0) return null;

        decimal mand = 0, disc = 0;
        foreach (var t in monthExp)
        {
            var n = CatName(t);
            if (IsMandatoryCategory(n)) mand += t.Amount;
            else disc += t.Amount;
        }

        var total = mand + disc;
        if (total <= 0) return null;

        var mp = (double)(mand / total * 100);
        var dp = (double)(disc / total * 100);
        var flex = Math.Round(Math.Clamp(dp, 0, 100), 0);

        string summary;
        if (flex >= 45)
            summary = "Bu ay esnek harcamaların görece yüksek; isteğe bağlı kalemlerde küçük düzenlemelerle tasarruf alanı açılabilir.";
        else if (flex <= 25)
            summary = "Bu ay harcamanın büyük kısmı zorunlu kalemlerde; esneklik sınırlı, önce büyük sabit giderleri gözden geçirmek daha etkili olur.";
        else
            summary = "Bu ay esnek ve zorunlu harcamalar dengeli bir bantta; rutin takip ile bütçeyi koruyabilirsin.";

        return new LifestyleProfileDto
        {
            FlexibilityScore = flex,
            MandatorySharePercent = Math.Round(mp, 1),
            DiscretionarySharePercent = Math.Round(dp, 1),
            Summary = summary,
        };
    }

    private CashFlowOutlookDto BuildCashFlow(
        List<Transaction> expenses,
        DateTime today,
        User? user)
    {
        var outlook = new CashFlowOutlookDto();
        var billCats = expenses
            .Where(t => !t.IsIncome && IsBillCategory(CatName(t)))
            .GroupBy(t => CatName(t))
            .Select(g =>
            {
                var byMonth = g.GroupBy(x => new { x.TransactionDate.Year, x.TransactionDate.Month })
                    .Select(m => m.Sum(x => x.Amount)).ToList();
                if (byMonth.Count == 0) return null;
                var last3 = byMonth.TakeLast(3).ToList();
                var avg = last3.Count > 0 ? last3.Average(x => (double)x) : byMonth.Average(x => (double)x);
                return new UpcomingPaymentHintDto
                {
                    CategoryLabel = g.Key,
                    TypicalMonthlyAmount = (decimal)avg,
                    BasisNote = last3.Count >= 2 ? "Son aylar ortalaması" : "Mevcut veriyle tahmin",
                };
            })
            .Where(x => x != null)
            .Cast<UpcomingPaymentHintDto>()
            .Take(4)
            .ToList();

        outlook.UpcomingHints = billCats;
        if (billCats.Count > 0)
        {
            var weekFrac = 7.0 / 30.0;
            outlook.PredictedWeekExpenseTotal = (decimal)(billCats.Sum(x => (double)x.TypicalMonthlyAmount) * weekFrac);
            outlook.BalanceOutlookMessage =
                $"Geçmiş fatura benzeri kalemlere göre önümüzdeki hafta yaklaşık {outlook.PredictedWeekExpenseTotal:F0} TL ödeme yükü olabilir (haftalık oran tahmini).";
            if (user?.MonthlyIncomeNet is { } inc && inc > 0 && inc / 4 > 0)
            {
                var wkPct = (double)(outlook.PredictedWeekExpenseTotal / (inc / 4) * 100);
                outlook.BalanceOutlookMessage +=
                    $" Aylık net gelir kaydına göre bu haftalık tahmin, haftalık gelir payının yaklaşık %{wkPct:F0} düzeyinde (kaba oran).";
            }
        }
        else
        {
            outlook.BalanceOutlookMessage = "Fatura veya sabit gider kategorilerinde yeterli tekrarlayan veri yok; işlem ekledikçe haftalık ödeme tahmini güçlenir.";
        }

        outlook.CreditGauge = new CreditLimitGaugeDto
        {
            HasData = false,
            UtilizationPercent = null,
            Message = "Kredi kartı limit doluluk oranı için kart limiti ve ekstre bakiyesi ayrıca kayda alınmadığından burada gösterilmiyor. İleride limit bilgisi eklenebilir.",
        };

        return outlook;
    }

    private AnalysisQaModuleDto? BuildQa(List<Transaction> expenses, DateTime today)
    {
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var prevStart = monthStart.AddMonths(-1);
        var prevSameDay = prevStart.AddDays(Math.Min(today.Day, DateTime.DaysInMonth(prevStart.Year, prevStart.Month)) - 1).AddDays(1);

        decimal currDining = 0, prevDining = 0;
        foreach (var t in expenses.Where(t => !t.IsIncome))
        {
            if (!IsDiningOutCategory(CatName(t))) continue;
            if (t.TransactionDate >= monthStart && t.TransactionDate < today.AddDays(1)) currDining += t.Amount;
            if (t.TransactionDate >= prevStart && t.TransactionDate < prevSameDay) prevDining += t.Amount;
        }

        if (prevDining <= 0 || currDining <= prevDining * 1.15m) return null;

        return new AnalysisQaModuleDto
        {
            Question = "Geçen aya göre dışarıda yemek / sosyal yeme harcaman artmış görünüyor. Bu bilinçli bir tercih mi, yoksa bütçeyi birlikte sıkılaştıralım mı?",
            OptionA = "Bütçemi kısıtla",
            OptionB = "Bu ay özel bir durum var",
            ChatMessageA = "Dışarıda yemek ve benzeri sosyal harcamalarımı bu ay için nasıl sınırlayabilirim? Somut haftalık üst limit ve kategori önerisi ver.",
            ChatMessageB = "Bu ay dışarıda yemek harcamamın artmasının nedeni geçici (özel durum); buna göre bütçe yorumunu güncelle.",
        };
    }

    private static double StdDev(List<double> xs)
    {
        if (xs.Count < 2) return 0;
        var m = xs.Average();
        return Math.Sqrt(xs.Sum(x => Math.Pow(x - m, 2)) / xs.Count);
    }

    /// <summary>
    /// Her ay için, o ayın 1'inden bugünün ay içi gününe kadar (o ayın gün sayısı kısa ise ay sonuna kadar) gider toplamı.
    /// Böylece son iki nokta «aynı süre» ile kıyaslanabilir.
    /// </summary>
    private static (DateTime Start, DateTime EndExclusive) ComparableMonthSlice(DateTime monthFirst, DateTime today)
    {
        var dim = DateTime.DaysInMonth(monthFirst.Year, monthFirst.Month);
        var takeDays = Math.Min(today.Day, dim);
        var endExclusive = monthFirst.AddDays(takeDays);
        return (monthFirst, endExclusive);
    }

    private static MonthSpendSparklineDto BuildMonthSpendSparkline(List<Transaction> expenses, DateTime today)
    {
        var points = new List<MonthSpendSparklinePointDto>();
        for (var i = -5; i <= 0; i++)
        {
            var monthStart = new DateTime(today.Year, today.Month, 1).AddMonths(i);
            var (start, endExclusive) = ComparableMonthSlice(monthStart, today);
            var total = expenses
                .Where(t => !t.IsIncome && t.TransactionDate >= start && t.TransactionDate < endExclusive)
                .Sum(t => t.Amount);
            points.Add(new MonthSpendSparklinePointDto
            {
                MonthKey = monthStart.ToString("yyyy-MM"),
                ShortLabel = monthStart.ToString("MMM", Tr),
                TotalExpense = Math.Round(total, 0),
            });
        }

        double? pct = null;
        if (points.Count >= 2)
        {
            var prev = (double)points[^2].TotalExpense;
            var curr = (double)points[^1].TotalExpense;
            if (prev > 0.5) pct = (curr - prev) / prev * 100.0;
        }

        var hasComparable = points.Exists(p => p.TotalExpense > 0);

        return new MonthSpendSparklineDto
        {
            Points = points,
            PercentChangeVsPreviousMonth = pct,
            HasComparableData = hasComparable,
        };
    }
}
