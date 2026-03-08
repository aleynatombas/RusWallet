namespace RusWallet.Infrastructure.Services;

/// <summary>Basit ML/istatistik yardımcıları: linear regression ile tahmin, ortalama, standart sapma.</summary>
internal static class MLPredictionHelper
{
    /// <summary>Son N aylık değerler üzerinden linear regression ile bir sonraki ayı tahmin eder.</summary>
    /// <param name="monthlyValues">Kronolojik sırada aylık toplamlar (en eski ilk).</param>
    /// <returns>Tahmin edilen bir sonraki ay değeri. Veri yoksa veya tek nokta varsa ortalama döner.</returns>
    public static decimal PredictNextByLinearRegression(IReadOnlyList<decimal> monthlyValues)
    {
        if (monthlyValues == null || monthlyValues.Count == 0)
            return 0;
        if (monthlyValues.Count == 1)
            return monthlyValues[0];

        int n = monthlyValues.Count;
        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (int i = 0; i < n; i++)
        {
            double x = i;
            double y = (double)monthlyValues[i];
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        }

        double denom = n * sumX2 - sumX * sumX;
        if (Math.Abs(denom) < 1e-10)
            return (decimal)(sumY / n);

        double b = (n * sumXY - sumX * sumY) / denom;
        double a = (sumY - b * sumX) / n;
        double nextY = a + b * n;
        return nextY > 0 ? (decimal)nextY : 0;
    }

    public static double Mean(IEnumerable<decimal> values)
    {
        var list = values.ToList();
        if (list.Count == 0) return 0;
        return (double)list.Average();
    }

    public static double StandardDeviation(IEnumerable<decimal> values)
    {
        var list = values.ToList();
        if (list.Count < 2) return 0;
        double mean = (double)list.Average();
        double sumSq = list.Sum(x => Math.Pow((double)x - mean, 2));
        return Math.Sqrt(sumSq / (list.Count - 1));
    }

    /// <summary>Z-score: (value - mean) / std. Std 0 ise 0 döner.</summary>
    public static double ZScore(decimal value, double mean, double std)
    {
        if (std <= 0) return 0;
        return ((double)value - mean) / std;
    }
}
