using System.Globalization;
using System.Text;
using RusWallet.Core.Entities;

namespace RusWallet.Infrastructure.Services.Insights;

/// <summary>ML motorlarının kullandığı sade gider kaydı (EF entity'sinden bağımsız, test edilebilir).</summary>
public sealed record ExpenseRecord(
    int TransactionId,
    DateTime Date,
    decimal Amount,
    int CategoryId,
    string CategoryName,
    string Description)
{
    public static ExpenseRecord From(Transaction t) => new(
        t.TransactionId,
        t.TransactionDate,
        t.Amount,
        t.CategoryId,
        string.IsNullOrWhiteSpace(t.Category?.Name) ? "Kategorisiz" : t.Category!.Name.Trim(),
        t.Description ?? "");
}

/// <summary>Kategori adına göre sabit gider / abonelik sınıflandırması.</summary>
public static class SpendingCategoryClassifier
{
    private static readonly CultureInfo Tr = CultureInfo.GetCultureInfo("tr-TR");

    private static readonly string[] FixedKeys =
    {
        "kira", "konut", "mortgage", "aidat", "yönetim", "yonetim", "apartman",
        "fatura", "elektrik", "doğalgaz", "dogalgaz", "ısıtma", "isitma", "internet", "telefon",
        "vergi", "sigorta", "dask", "kasko", "kredi", "taksit", "leasing",
        "okul", "kreş", "kres", "üniversite", "universite", "dershane", "yurt",
    };

    private static readonly string[] SubscriptionKeys =
    {
        "abonelik", "üyelik", "uyelik",
        "netflix", "spotify", "youtube", "apple", "icloud", "disney", "prime", "exxen", "blutv", "gain",
        "bein", "tivibu", "tod", "dsmart", "d-smart", "microsoft 365", "office 365", "google one", "adobe",
        "dropbox", "chatgpt", "openai", "playstation", "xbox", "steam", "gym", "fitness", "spor salonu",
    };

    public static string Normalize(string? s) => (s ?? "").Trim().ToLower(Tr);

    public static bool IsFixedCategory(string categoryName)
    {
        var n = Normalize(categoryName);
        return FixedKeys.Any(k => n.Contains(k, StringComparison.Ordinal)) || IsSubscriptionText(n);
    }

    public static bool IsSubscriptionText(string text)
    {
        var n = Normalize(text);
        return SubscriptionKeys.Any(k => n.Contains(k, StringComparison.Ordinal));
    }

    /// <summary>Açıklamayı gruplama anahtarına çevirir: küçük harf, rakam/noktalama yok, ilk 3 kelime.</summary>
    public static string DescriptionKey(string description)
    {
        var n = Normalize(description);
        var sb = new StringBuilder(n.Length);
        foreach (var ch in n)
            sb.Append(char.IsLetter(ch) ? ch : ' ');
        var words = sb.ToString().Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(3);
        return string.Join(' ', words);
    }
}

internal static class Stats
{
    public static double Median(IReadOnlyList<double> xs)
    {
        if (xs.Count == 0) return 0;
        var s = xs.OrderBy(x => x).ToArray();
        var mid = s.Length / 2;
        return s.Length % 2 == 1 ? s[mid] : (s[mid - 1] + s[mid]) / 2.0;
    }

    public static double Mean(IReadOnlyList<double> xs) => xs.Count == 0 ? 0 : xs.Average();

    public static double StdDev(IReadOnlyList<double> xs)
    {
        if (xs.Count < 2) return 0;
        var m = xs.Average();
        return Math.Sqrt(xs.Sum(x => (x - m) * (x - m)) / (xs.Count - 1));
    }

    /// <summary>Median Absolute Deviation (aykırı değerlere dayanıklı yayılım ölçüsü).</summary>
    public static double Mad(IReadOnlyList<double> xs)
    {
        if (xs.Count == 0) return 0;
        var med = Median(xs);
        return Median(xs.Select(x => Math.Abs(x - med)).ToList());
    }

    /// <summary>Doğrusal interpolasyonlu yüzdelik (p: 0–1).</summary>
    public static double Percentile(IReadOnlyList<double> xs, double p)
    {
        if (xs.Count == 0) return 0;
        var s = xs.OrderBy(x => x).ToArray();
        var pos = (s.Length - 1) * Math.Clamp(p, 0, 1);
        var lo = (int)Math.Floor(pos);
        var hi = (int)Math.Ceiling(pos);
        return lo == hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (pos - lo);
    }

    public static double CoefficientOfVariation(IReadOnlyList<double> xs)
    {
        var m = Mean(xs);
        return m <= 0 ? 0 : StdDev(xs) / m;
    }
}
