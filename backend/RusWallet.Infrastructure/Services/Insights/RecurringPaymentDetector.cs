namespace RusWallet.Infrastructure.Services.Insights;

/// <summary>Tespit edilen düzenli (aylık) ödeme.</summary>
public sealed class RecurringPayment
{
    public string Name { get; init; } = "";
    public int CategoryId { get; init; }
    public string CategoryName { get; init; } = "";
    public decimal ExpectedAmount { get; init; }
    public decimal FirstAmount { get; init; }
    public decimal LatestAmount { get; init; }
    public int TypicalDayOfMonth { get; init; }
    public int MonthsObserved { get; init; }
    public DateTime LastDate { get; init; }
    public bool IsSubscription { get; init; }
    /// <summary>Hâlâ devam ediyor mu (son ödeme 45 gün içinde).</summary>
    public bool IsActive { get; init; }
    public HashSet<int> TransactionIds { get; init; } = new();
}

/// <summary>
/// Aylık tekrarlayan ödemeleri bulur (kira, fatura, abonelik).
/// Kural: aynı açıklama (veya sabit gider kategorisi) en az 3 farklı ayda (tutar çok tutarlıysa 2 ardışık ayda),
/// ödemeler arası medyan aralık 25–35 gün, tutar değişkenlik katsayısı ≤ %25 veya en fazla bir fiyat değişikliği.
/// Bu işlemler tahminde ayrı bir bileşen olarak eklenir ve anomali tespitinde dışarıda tutulur.
/// </summary>
public static class RecurringPaymentDetector
{
    public static List<RecurringPayment> Detect(IReadOnlyList<ExpenseRecord> expenses, DateTime today)
    {
        var result = new List<RecurringPayment>();
        var used = new HashSet<int>();

        // 1. geçiş: kategori + açıklama
        foreach (var g in expenses
                     .Where(e => SpendingCategoryClassifier.DescriptionKey(e.Description).Length > 0)
                     .GroupBy(e => (e.CategoryId, Key: SpendingCategoryClassifier.DescriptionKey(e.Description))))
        {
            var rp = TryBuild(g.ToList(), g.First().Description.Trim(), today);
            if (rp == null) continue;
            result.Add(rp);
            used.UnionWith(rp.TransactionIds);
        }

        // 2. geçiş: sabit gider kategorileri (açıklaması her ay farklı yazılmış kira/fatura gibi)
        foreach (var g in expenses
                     .Where(e => !used.Contains(e.TransactionId) && SpendingCategoryClassifier.IsFixedCategory(e.CategoryName))
                     .GroupBy(e => e.CategoryId))
        {
            var rp = TryBuild(g.ToList(), g.First().CategoryName, today);
            if (rp == null) continue;
            result.Add(rp);
            used.UnionWith(rp.TransactionIds);
        }

        return result.OrderByDescending(r => r.ExpectedAmount).ToList();
    }

    private static RecurringPayment? TryBuild(List<ExpenseRecord> items, string name, DateTime today)
    {
        if (items.Count < 2) return null;

        var byMonth = items.GroupBy(e => (e.Date.Year, e.Date.Month)).ToList();
        // Ayda birden fazla ödeme olan gruplar (ör. market) aylık düzenli ödeme değildir.
        var singleMonths = byMonth.Count(m => m.Count() == 1);
        if (singleMonths < byMonth.Count * 0.8) return null;

        var monthly = byMonth
            .Select(m => m.OrderByDescending(x => x.Amount).First())
            .OrderBy(x => x.Date)
            .ToList();
        if (monthly.Count < 2) return null;

        var amounts = monthly.Select(x => (double)x.Amount).ToList();
        var cv = Stats.CoefficientOfVariation(amounts);
        var intervals = monthly.Zip(monthly.Skip(1), (a, b) => (b.Date - a.Date).TotalDays).ToList();
        var medianInterval = Stats.Median(intervals);

        // Tek seferlik fiyat değişikliği (zam) olan abonelikler de düzenli sayılır: tutar en fazla bir kez %5'ten fazla değişmiş olmalı.
        var levelChanges = monthly.Zip(monthly.Skip(1), (a, b) => a.Amount > 0 && Math.Abs(b.Amount - a.Amount) / a.Amount > 0.05m).Count(c => c);
        var amountsConsistent = cv <= 0.25 || levelChanges <= 1;

        var enoughMonths = monthly.Count >= 3 || (monthly.Count == 2 && cv <= 0.05);
        if (!enoughMonths || medianInterval < 25 || medianInterval > 35 || !amountsConsistent) return null;

        var last3 = monthly.TakeLast(3).Select(x => (double)x.Amount).ToList();
        var last = monthly[^1];
        var isSub = SpendingCategoryClassifier.IsSubscriptionText(name) ||
                    SpendingCategoryClassifier.IsSubscriptionText(last.CategoryName);

        return new RecurringPayment
        {
            Name = name,
            CategoryId = last.CategoryId,
            CategoryName = last.CategoryName,
            ExpectedAmount = Math.Round((decimal)Stats.Median(last3), 2),
            FirstAmount = monthly[0].Amount,
            LatestAmount = last.Amount,
            TypicalDayOfMonth = (int)Math.Round(Stats.Median(monthly.Select(x => (double)x.Date.Day).ToList())),
            MonthsObserved = monthly.Count,
            LastDate = last.Date,
            IsSubscription = isSub,
            IsActive = (today - last.Date).TotalDays <= 45,
            TransactionIds = items.Select(x => x.TransactionId).ToHashSet(),
        };
    }
}
