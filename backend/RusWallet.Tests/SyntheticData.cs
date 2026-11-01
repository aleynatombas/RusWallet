using RusWallet.Infrastructure.Services.Insights;

namespace RusWallet.Tests;

/// <summary>Tekrarlanabilir (seed'li) sentetik kullanıcı harcama geçmişi.</summary>
internal static class SyntheticData
{
    public static readonly DateTime Today = new(2026, 11, 15);

    public const int Market = 1, Restoran = 2, Ulasim = 3, Kira = 4, Abonelik = 5;

    public static List<ExpenseRecord> Build(
        int months = 8,
        bool restaurantTrendUp = false,
        bool spotifyPriceIncrease = false,
        int seed = 42)
    {
        var rnd = new Random(seed);
        var list = new List<ExpenseRecord>();
        var id = 1;
        var start = new DateTime(Today.Year, Today.Month, 1).AddMonths(-months);

        for (var d = start; d <= Today; d = d.AddDays(1))
        {
            // Market: haftada ~3 kez, ~300 ₺
            if (rnd.NextDouble() < 0.43)
                list.Add(new(id++, d, Round(300 + Gaussian(rnd) * 50), Market, "Market", "Migros alışveriş"));

            // Restoran: haftada ~1.5 kez; istenirse son 3 ay belirgin artış
            var recent = d >= new DateTime(Today.Year, Today.Month, 1).AddMonths(-3);
            var restBase = restaurantTrendUp && recent ? 420 : 250;
            if (rnd.NextDouble() < (restaurantTrendUp && recent ? 0.35 : 0.2))
                list.Add(new(id++, d, Round(restBase + Gaussian(rnd) * 40), Restoran, "Restoran", "Akşam yemeği"));

            // Ulaşım: neredeyse her iş günü küçük tutar
            if (d.DayOfWeek is not DayOfWeek.Saturday and not DayOfWeek.Sunday && rnd.NextDouble() < 0.8)
                list.Add(new(id++, d, Round(40 + Gaussian(rnd) * 5), Ulasim, "Ulaşım", "Metro"));

            // Düzenli ödemeler
            if (d.Day == 1)
                list.Add(new(id++, d, 15000, Kira, "Kira", "Ev kirası"));
            if (d.Day == 10)
                list.Add(new(id++, d, 229.99m, Abonelik, "Abonelik", "Netflix"));
            if (d.Day == 12)
            {
                var monthsFromStart = (d.Year - start.Year) * 12 + d.Month - start.Month;
                var price = spotifyPriceIncrease && monthsFromStart >= months - 2 ? 99.99m : 59.99m;
                list.Add(new(id++, d, price, Abonelik, "Abonelik", "Spotify"));
            }
        }

        return list;
    }

    public static int NextId(IEnumerable<ExpenseRecord> list) => list.Max(e => e.TransactionId) + 1;

    private static decimal Round(double v) => Math.Round((decimal)Math.Max(5, v), 2);

    private static double Gaussian(Random rnd)
    {
        var u1 = 1.0 - rnd.NextDouble();
        var u2 = rnd.NextDouble();
        return Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Sin(2.0 * Math.PI * u2);
    }
}
