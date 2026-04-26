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

    public AnalysisRoadmapService(ITransactionRepository transactions, IUserRepository users)
    {
        _transactions = transactions;
        _users = users;
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
            Cockpit = BuildFinancialCockpit(expenses, today, user),
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

    /// <summary>Kokpit üçlüsü. <see cref="MonthEndExpectationCockpitDto.InsightStack"/> = predictive (AI+preset), radar/fırsat = ML ürün etiketi.</summary>
    private FinancialCockpitDto BuildFinancialCockpit(List<Transaction> expenses, DateTime today, User? user)
    {
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var prevMonthStart = monthStart.AddMonths(-1);
        var dayInMonth = today.Day;
        var prevSliceEnd = prevMonthStart.AddDays(Math.Min(dayInMonth, DateTime.DaysInMonth(prevMonthStart.Year, prevMonthStart.Month)) - 1).AddDays(1);
        var dim = DateTime.DaysInMonth(today.Year, today.Month);
        var elapsed = Math.Max(1, today.Day);
        var daysRemaining = Math.Max(0, dim - today.Day);

        var monthExpenseList = expenses.Where(t => t.TransactionDate >= monthStart && !t.IsIncome).ToList();
        var spentMonth = monthExpenseList.Sum(t => t.Amount);

        decimal spentFlexMtd = 0;
        foreach (var t in monthExpenseList)
        {
            if (!IsFixedMonthlyCategory(CatName(t)))
                spentFlexMtd += t.Amount;
        }

        var projFlexEndOfMonth = spentFlexMtd / elapsed * dim;

        decimal? disposable = null;
        if (user?.MonthlyIncomeNet is { } inc && inc > 0)
        {
            var fix = user.MonthlyFixedCostsApprox ?? 0;
            disposable = Math.Max(0, inc - fix);
        }

        decimal projected;
        var fill = 0;
        var overPace = false;
        var projectedUsesSplit = false;

        if (disposable is > 0 && user?.MonthlyFixedCostsApprox is { } fixApprox && fixApprox > 0)
        {
            projected = fixApprox + projFlexEndOfMonth;
            projectedUsesSplit = true;
            fill = (int)Math.Min(100, Math.Round((double)(projFlexEndOfMonth / disposable.Value) * 100));
            overPace = projFlexEndOfMonth > disposable.Value * 0.92m;
        }
        else if (disposable is > 0)
        {
            projected = spentMonth / elapsed * dim;
            fill = (int)Math.Min(100, Math.Round((double)(projected / disposable.Value) * 100));
            overPace = projected > disposable.Value * 0.92m;
        }
        else
        {
            projected = spentMonth / elapsed * dim;
            fill = (int)Math.Min(100, Math.Round(100.0 * today.Day / dim));
        }

        var monthShort = overPace
            ? (projectedUsesSplit
                ? "Mevcut esnek harcama temponla ay sonu esnek payını zorlayabilirsin."
                : "Mevcut temponla ay sonu esnek payını zorlayabilirsin.")
            : (projectedUsesSplit
                ? "Mevcut esnek harcama temponla ay sonu bütçeni koruyabilirsin."
                : "Mevcut temponla ay sonu bütçeni koruyabilirsin.");

        var forecastNext = ComputeForecastNextMonthTotal(expenses, monthStart);

        var monthEnd = new MonthEndExpectationCockpitDto
        {
            ProjectedMonthTotal = Math.Round(projected, 0),
            DaysRemainingInMonth = daysRemaining,
            BudgetFillPercent = fill,
            IsOverPaceVersusDisposable = overPace,
            HasDisposableReference = disposable is > 0,
            ProjectedUsesFixedPlusFlexibleSplit = projectedUsesSplit,
            ShortMessage = monthShort,
            ActionChatMessage = "Bu ayki harcama temposuna göre ay sonunda nerede olabilirim? Günlük ne kadar harcamaya çekilmeliyim?",
            InsightStack = "predictive_analysis",
            ForecastNextMonthTotal = forecastNext,
        };

        // Radar — son 3 gün, kategori ortalamasının üzerinde uç işlem
        var recent = expenses.Where(t => (today - t.TransactionDate.Date).TotalDays <= 3 && t.TransactionDate <= today).ToList();
        var hits = new List<RadarHitItemDto>();
        var radarLowData = false;

        foreach (var g in recent.GroupBy(t => CatName(t)))
        {
            var name = g.Key;
            var hist = expenses.Where(t => CatName(t) == name && t.TransactionDate < monthStart).Select(t => t.Amount).ToList();
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
                .Any(g => expenses.Count(t => CatName(t) == g.Key && t.TransactionDate < monthStart) >= 3);
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
            radar.ShortMessage = "Geçmiş işlem sayısı arttıkça radar daha hassas çalışır.";
        }

        if (hits.Count == 0)
        {
            var topMonth = expenses
                .Where(t => t.TransactionDate >= monthStart && t.TransactionDate < today.AddDays(1) && !t.IsIncome)
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

        // Fırsatlar — kural tabanlı kıyas; ileride ML sıralama / kazanç tahmini buraya bağlanabilir (InsightStack = ml_opportunity).
        var tiles = new List<OpportunityTileDto>();
        var isLearning = true;
        var oppShort = "Henüz bu dönem için belirgin bir tasarruf sinyali yok; işlem ve dönem verisi arttıkça kıyaslama netleşir.";
        var oppChat = "Mevcut harcama dağılımıma göre küçük ama etkili tasarruf önerileri ver.";

        var subCurr = expenses.Where(t => t.TransactionDate >= monthStart && t.TransactionDate < today.AddDays(1) && IsSubscriptionCategory(CatName(t))).Sum(t => t.Amount);
        var subPrev = expenses.Where(t => t.TransactionDate >= prevMonthStart && t.TransactionDate < prevSliceEnd && IsSubscriptionCategory(CatName(t))).Sum(t => t.Amount);

        if (subPrev > 0 && subCurr > subPrev * 1.05m)
        {
            var pct = (double)((subCurr - subPrev) / subPrev * 100);
            var estSave = Math.Round(Math.Min(subCurr - subPrev * 0.85m, subCurr * 0.2m), 0);
            if (estSave < 50) estSave = Math.Max(50, Math.Round((subCurr - subPrev) * 0.15m, 0));
            isLearning = false;
            oppShort = "Abonelik ve düzenli ödemelerde gözden geçirme fırsatı olabilir.";
            oppChat = "Abonelik ve düzenli ödemelerimde hangi kalemleri iptal edebilir veya düşük pakete geçebilirim? Son aylara göre özetle.";
            tiles.Add(new OpportunityTileDto
            {
                IconEmoji = "📱",
                Label = "Abonelik",
                Subtitle = $"+%{pct:F0} bu döneme göre",
                EstimatedSaving = estSave,
            });
        }
        else
        {
            var totCurr = expenses.Where(t => t.TransactionDate >= monthStart && t.TransactionDate < today.AddDays(1)).Sum(t => t.Amount);
            var totPrev = expenses.Where(t => t.TransactionDate >= prevMonthStart && t.TransactionDate < prevSliceEnd).Sum(t => t.Amount);
            if (totPrev > 50 && totCurr > totPrev * 1.04m)
            {
                var pct = (double)((totCurr - totPrev) / totPrev * 100);
                isLearning = false;
                oppShort = "Toplam harcama geçen ayın aynı dönemine göre yükselmiş görünüyor.";
                oppChat = "Bu ay geçen ayın aynı dönemine göre hangi kategorilerde en çok artış var? Üç madde halinde özetle ve ne yapabileceğimi yaz.";
                tiles.Add(new OpportunityTileDto
                {
                    IconEmoji = "📈",
                    Label = "Toplam gider",
                    Subtitle = $"+%{pct:F0} aynı dönem",
                    EstimatedSaving = null,
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

    /// <summary>Son üç tam takvim ayının gider toplamlarının ortalaması; veri yoksa null.</summary>
    private static decimal? ComputeForecastNextMonthTotal(List<Transaction> expenses, DateTime monthStart)
    {
        var sums = new decimal[3];
        for (var back = 1; back <= 3; back++)
        {
            var start = monthStart.AddMonths(-back);
            var end = start.AddMonths(1);
            sums[back - 1] = expenses.Where(t => !t.IsIncome && t.TransactionDate >= start && t.TransactionDate < end).Sum(t => t.Amount);
        }

        if (sums[0] <= 0 && sums[1] <= 0 && sums[2] <= 0) return null;
        return Math.Round((sums[0] + sums[1] + sums[2]) / 3m, 0);
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
