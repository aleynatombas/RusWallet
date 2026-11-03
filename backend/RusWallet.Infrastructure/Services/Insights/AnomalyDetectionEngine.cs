using System.Globalization;
using Microsoft.ML;
using Microsoft.ML.Data;
using RusWallet.Core.DTOs.Finance;

namespace RusWallet.Infrastructure.Services.Insights;

/// <summary>
/// Kullanıcının normal harcama davranışını öğrenip son 30 gündeki olağan dışı durumları bulur.
///
/// A) İşlem bazlı (unusual_transaction): ML.NET K-Means (en yakın küme merkezine uzaklık) ve Randomized PCA (yeniden oluşturma hatası).
///    Özellikler: log(tutar), kategori içi dayanıklı z-skoru (medyan/MAD), kategorideki son 30 gün sıklığı,
///    haftanın günü (sin/cos), kategoride önceki işlemden bu yana geçen gün.
///    Model geçmiş işlemlerle eğitilir; eşik, eğitim skorlarının %97,5 yüzdeliğidir.
///    Yanlış alarmı azaltmak için ayrıca istatistiksel doğrulama istenir (dayanıklı z ≥ 2,5 ve tutar ≥ 1,8 × kategori medyanı).
/// B) Kategori bazlı: bu ayın aynı gününe kadarki kategori toplamı / işlem sayısı, önceki ayların aynı dilimiyle kıyaslanır
///    (ortalama + 2σ ve en az %50 fazlası; sıklık için Poisson yaklaşımı).
/// Düzenli ödemeler (kira, abonelik…) ve kullanıcının "normal" dediği kayıtlar değerlendirme dışıdır.
/// </summary>
public static class AnomalyDetectionEngine
{
    private static readonly CultureInfo Tr = CultureInfo.GetCultureInfo("tr-TR");
    public const int WindowDays = 30;
    public const int MinTrainingTransactions = 25;
    public const int MinHistoryDays = 45;
    private const double ScorePercentileThreshold = 0.975;

    public static AnomalyInsightDto Detect(
        IReadOnlyList<ExpenseRecord> expenses,
        IReadOnlyList<RecurringPayment> recurring,
        IReadOnlySet<string> dismissedKeys,
        DateTime today)
    {
        today = today.Date;
        var windowStart = today.AddDays(-WindowDays + 1);
        var recurringIds = recurring.SelectMany(r => r.TransactionIds).ToHashSet();

        var variable = expenses.Where(e => !recurringIds.Contains(e.TransactionId)).OrderBy(e => e.Date).ToList();
        var training = variable.Where(e => e.Date < windowStart).ToList();
        var evaluation = variable.Where(e => e.Date >= windowStart && e.Date < today.AddDays(1)).ToList();

        var historyDays = expenses.Count == 0 ? 0 : (int)(today - expenses.Min(e => e.Date).Date).TotalDays + 1;
        var dto = new AnomalyInsightDto
        {
            EvaluatedWindowDays = WindowDays,
            EvaluatedTransactionCount = evaluation.Count,
            ExcludedRecurringCount = expenses.Count(e => e.Date >= windowStart && recurringIds.Contains(e.TransactionId)),
            DataQuality = new DataSufficiencyDto
            {
                HistoryDays = historyDays,
                ExpenseTransactionCount = training.Count,
                CompleteMonths = expenses.Where(e => e.Date < new DateTime(today.Year, today.Month, 1))
                    .Select(e => (e.Date.Year, e.Date.Month)).Distinct().Count(),
                RequiredHistoryDays = MinHistoryDays,
                RequiredTransactions = MinTrainingTransactions,
            },
        };

        if (historyDays < MinHistoryDays || training.Count < MinTrainingTransactions)
        {
            var needs = new List<string>();
            if (historyDays < MinHistoryDays) needs.Add($"{MinHistoryDays - historyDays} gün daha geçmiş");
            if (training.Count < MinTrainingTransactions) needs.Add($"{MinTrainingTransactions - training.Count} gider kaydı daha (kira, fatura ve abonelikler hariç)");
            dto.DataQuality.Level = "insufficient";
            dto.DataQuality.Message = $"Normal harcama davranışını öğrenmek için {string.Join(" ve ", needs)} gerekiyor.";
            dto.Status = "insufficient_data";
            dto.Message = dto.DataQuality.Message;
            return dto;
        }

        dto.DataQuality.Level = historyDays >= 90 && training.Count >= 60 ? "good" : "limited";
        dto.DataQuality.Message = $"{training.Count} geçmiş işlemden normal davranış öğrenildi.";

        var items = new List<AnomalyItemDto>();
        var (txItems, modelName) = DetectTransactionAnomalies(training, evaluation, variable);
        items.AddRange(txItems);
        items.AddRange(DetectCategoryAnomalies(variable, today));

        var visible = items.Where(i => !dismissedKeys.Contains(i.Key)).ToList();
        dto.DismissedCount = items.Count - visible.Count;
        dto.Items = visible
            .OrderByDescending(i => i.Severity == "high")
            .ThenByDescending(i => i.DeviationPercent)
            .ToList();
        dto.TotalCount = dto.Items.Count;
        dto.TopCategoryName = dto.Items
            .GroupBy(i => i.CategoryName)
            .OrderByDescending(g => g.Sum(x => x.CurrentAmount))
            .Select(g => g.Key)
            .FirstOrDefault();
        dto.ModelName = modelName;
        dto.Status = "ready";
        dto.Message = dto.TotalCount == 0
            ? $"Son {WindowDays} günde harcamaların alışkanlıklarınla uyumlu."
            : $"Son {WindowDays} günde {dto.TotalCount} olağan dışı durum bulundu.";
        return dto;
    }

    // ── A) İşlem bazlı: Randomized PCA ────────────────────────────────────

    private sealed class CategoryProfile
    {
        public double LogMedian;
        public double LogMadScaled;
        public double AmountMedian;
        public double MonthlyFrequency;
    }

    private static (List<AnomalyItemDto> Items, string ModelName) DetectTransactionAnomalies(
        List<ExpenseRecord> training, List<ExpenseRecord> evaluation, List<ExpenseRecord> allVariable)
    {
        var globalLogs = training.Select(t => Math.Log(1 + (double)t.Amount)).ToList();
        var global = new CategoryProfile
        {
            LogMedian = Stats.Median(globalLogs),
            LogMadScaled = Math.Max(1.4826 * Stats.Mad(globalLogs), 0.25),
            AmountMedian = Stats.Median(training.Select(t => (double)t.Amount).ToList()),
        };
        var trainingSpanDays = Math.Max(30, (training[^1].Date - training[0].Date).TotalDays + 1);
        var profiles = training
            .GroupBy(t => t.CategoryId)
            .Where(g => g.Count() >= 4)
            .ToDictionary(g => g.Key, g =>
            {
                var logs = g.Select(t => Math.Log(1 + (double)t.Amount)).ToList();
                return new CategoryProfile
                {
                    LogMedian = Stats.Median(logs),
                    LogMadScaled = Math.Max(1.4826 * Stats.Mad(logs), 0.25),
                    AmountMedian = Stats.Median(g.Select(t => (double)t.Amount).ToList()),
                    MonthlyFrequency = g.Count() / trainingSpanDays * 30.0,
                };
            });

        CategoryProfile ProfileOf(ExpenseRecord t) => profiles.TryGetValue(t.CategoryId, out var p) ? p : global;

        double RobustZ(ExpenseRecord t)
        {
            var p = ProfileOf(t);
            return (Math.Log(1 + (double)t.Amount) - p.LogMedian) / p.LogMadScaled;
        }

        TxFeatures Featurize(ExpenseRecord t)
        {
            var prior = allVariable.Where(x => x.CategoryId == t.CategoryId && x.Date < t.Date).ToList();
            var last30 = prior.Count(x => x.Date >= t.Date.AddDays(-30));
            var daysSince = prior.Count > 0 ? (t.Date - prior[^1].Date).TotalDays : 60;
            var dow = 2 * Math.PI * (int)t.Date.DayOfWeek / 7.0;
            var freq = ProfileOf(t).MonthlyFrequency;
            return new TxFeatures
            {
                Features = new[]
                {
                    (float)Math.Log(1 + (double)t.Amount),
                    (float)RobustZ(t),
                    (float)Math.Log((1 + last30) / (1 + freq)),
                    (float)Math.Sin(dow),
                    (float)Math.Cos(dow),
                    (float)Math.Log(1 + Math.Min(daysSince, 120)),
                },
            };
        }

        double[]? kmPct, pcaPct;
        var modelName = "Dayanıklı z-skoru (medyan/MAD)";
        try
        {
            var ml = new MLContext(seed: 0);
            var trainData = ml.Data.LoadFromEnumerable(training.Select(Featurize).ToList());
            var evalData = ml.Data.LoadFromEnumerable(evaluation.Select(Featurize).ToList());
            var normalizer = ml.Transforms.NormalizeMeanVariance(nameof(TxFeatures.Features)).Fit(trainData);
            var trainNorm = normalizer.Transform(trainData);
            var evalNorm = normalizer.Transform(evalData);

            // (1) K-Means: normal işlemlerin kümelerini öğrenir; en yakın merkeze uzaklık = sıra dışılık.
            //     Her yöndeki uç değerleri (ör. çok büyük tutar) yakalar.
            var k = Math.Clamp(training.Count / 40, 2, 6);
            var kmeans = ml.Clustering.Trainers.KMeans(nameof(TxFeatures.Features), numberOfClusters: k).Fit(trainNorm);
            double MinDist(KMeansOutput o) => o.Distances is { Length: > 0 } d ? d.Min() : 0;
            var kmTrain = ml.Data.CreateEnumerable<KMeansOutput>(kmeans.Transform(trainNorm), false).Select(MinDist).ToList();
            var kmEval = ml.Data.CreateEnumerable<KMeansOutput>(kmeans.Transform(evalNorm), false).Select(MinDist).ToArray();

            // (2) Randomized PCA: özellikler arası alışılmadık kombinasyonları (yeniden oluşturma hatası) yakalar.
            var pca = ml.AnomalyDetection.Trainers.RandomizedPca(
                featureColumnName: nameof(TxFeatures.Features), rank: 3, ensureZeroMean: true, seed: 0).Fit(trainNorm);
            var pcaTrain = ml.Data.CreateEnumerable<PcaOutput>(pca.Transform(trainNorm), false).Select(o => (double)o.Score).ToList();
            var pcaEval = ml.Data.CreateEnumerable<PcaOutput>(pca.Transform(evalNorm), false).Select(o => (double)o.Score).ToArray();

            kmPct = ToPercentiles(kmTrain, kmEval);
            pcaPct = ToPercentiles(pcaTrain, pcaEval);
            modelName = "ML.NET K-Means + Randomized PCA + dayanıklı z-skoru";
        }
        catch
        {
            kmPct = pcaPct = null; // ML başarısızsa yalnızca istatistiksel yöntem kullanılır
        }
        var evalPercentiles = kmPct;

        var items = new List<AnomalyItemDto>();
        for (var i = 0; i < evaluation.Count; i++)
        {
            var t = evaluation[i];
            var p = ProfileOf(t);
            var z = RobustZ(t);
            var ratio = p.AmountMedian > 0 ? (double)t.Amount / p.AmountMedian : 0;
            var statFlag = z >= 2.5 && ratio >= 1.8;
            var kmFlag = kmPct?[i] >= ScorePercentileThreshold;
            var pcaFlag = pcaPct?[i] >= ScorePercentileThreshold;
            var mlFlag = kmFlag || pcaFlag;
            double? pct = evalPercentiles == null ? null : Math.Max(kmPct![i], pcaPct![i]);

            // ML varsa ML + istatistik onayı birlikte gerekir; ML yoksa daha sıkı istatistik eşiği.
            var flagged = evalPercentiles != null ? mlFlag && statFlag : z >= 3.5 && ratio >= 2.5;
            if (!flagged) continue;

            var methods = new List<string>();
            if (kmFlag) methods.Add("ML.NET K-Means");
            if (pcaFlag) methods.Add("ML.NET Randomized PCA");
            methods.Add("Dayanıklı z-skoru");
            var deviation = Math.Round((ratio - 1) * 100, 0);
            items.Add(new AnomalyItemDto
            {
                Key = $"tx:{t.TransactionId}",
                Type = "unusual_transaction",
                Severity = z >= 4 || ratio >= 4 ? "high" : "medium",
                CategoryName = t.CategoryName,
                CategoryId = t.CategoryId,
                TransactionId = t.TransactionId,
                Description = t.Description,
                Date = t.Date,
                CurrentAmount = Math.Round(t.Amount, 0),
                NormalAmount = Math.Round((decimal)p.AmountMedian, 0),
                DeviationPercent = deviation,
                AnomalyScore = pct.HasValue ? Math.Round(pct.Value, 3) : null,
                Reason = "Alışılmadık yüksek tutar",
                Explanation =
                    $"{t.CategoryName} kategorisinde tipik işlemin {Fmt((decimal)p.AmountMedian)}; bu işlem {Fmt(t.Amount)} " +
                    $"(yaklaşık {ratio.ToString("0.0", Tr)} katı). Tutar, geçmiş dağılımının çok dışında kalıyor.",
                DetectionMethods = methods,
            });
        }

        return (items, modelName);
    }

    /// <summary>Her değerlendirme skorunun eğitim skorları dağılımındaki yüzdeliği (0–1).</summary>
    private static double[] ToPercentiles(List<double> trainScores, double[] evalScores)
    {
        var sorted = trainScores.Where(s => !double.IsNaN(s)).OrderBy(x => x).ToArray();
        if (sorted.Length == 0) return evalScores.Select(_ => 0.0).ToArray();
        return evalScores.Select(s => double.IsNaN(s) ? 0 : (double)UpperBound(sorted, s) / sorted.Length).ToArray();
    }

    private static int UpperBound(double[] sorted, double value)
    {
        int lo = 0, hi = sorted.Length;
        while (lo < hi)
        {
            var mid = (lo + hi) / 2;
            if (sorted[mid] <= value) lo = mid + 1; else hi = mid;
        }
        return lo;
    }

    // ── B) Kategori bazlı: tutar ve sıklık ────────────────────────────────

    private static List<AnomalyItemDto> DetectCategoryAnomalies(List<ExpenseRecord> variable, DateTime today)
    {
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var monthKey = $"{today.Year:D4}-{today.Month:D2}";
        var items = new List<AnomalyItemDto>();
        // Ayın ilk birkaç gününde dilim kıyaslaması anlamsız.
        if (today.Day < 7) return items;

        var firstDate = variable.Count > 0 ? variable[0].Date : today;
        var current = variable.Where(e => e.Date >= monthStart && e.Date < today.AddDays(1)).ToList();

        foreach (var g in current.GroupBy(e => e.CategoryId))
        {
            var name = g.First().CategoryName;
            var curSum = (double)g.Sum(x => x.Amount);
            var curCount = g.Count();

            var sliceSums = new List<double>();
            var sliceCounts = new List<double>();
            for (var back = 1; back <= 6; back++)
            {
                var ms = monthStart.AddMonths(-back);
                if (ms.AddMonths(1) <= firstDate) break;
                var sliceEnd = ms.AddDays(Math.Min(today.Day, DateTime.DaysInMonth(ms.Year, ms.Month)));
                var slice = variable.Where(e => e.CategoryId == g.Key && e.Date >= ms && e.Date < sliceEnd).ToList();
                sliceSums.Add((double)slice.Sum(x => x.Amount));
                sliceCounts.Add(slice.Count);
            }
            if (sliceSums.Count(s => s > 0) < 3) continue;

            var mean = Stats.Mean(sliceSums);
            var std = Stats.StdDev(sliceSums);
            var series = sliceSums.AsEnumerable().Reverse().Append(curSum).Select(v => (decimal)v).ToList();
            var iidSpike = MlNetAnomalyService.IsLastPointSpike(series, confidence: 95);
            if (mean > 0 && curSum >= mean + 2 * Math.Max(std, mean * 0.1) && curSum >= mean * 1.5)
            {
                var dev = Math.Round((curSum / mean - 1) * 100, 0);
                var methods = new List<string> { "Ortalama + 2σ" };
                if (iidSpike) methods.Insert(0, "ML.NET IID Spike");
                items.Add(new AnomalyItemDto
                {
                    Key = $"cat-amount:{g.Key}:{monthKey}",
                    Type = "category_spike",
                    Severity = curSum >= mean * 2.5 ? "high" : "medium",
                    CategoryName = name,
                    CategoryId = g.Key,
                    CurrentAmount = Math.Round((decimal)curSum, 0),
                    NormalAmount = Math.Round((decimal)mean, 0),
                    DeviationPercent = dev,
                    Reason = "Kategori harcaması arttı",
                    Explanation =
                        $"Ayın ilk {today.Day} gününde {name} harcaman {Fmt((decimal)curSum)}. " +
                        $"Önceki {sliceSums.Count} ayın aynı döneminde ortalama {Fmt((decimal)mean)} idi.",
                    DetectionMethods = methods,
                });
            }

            var meanCount = Stats.Mean(sliceCounts);
            if (curCount >= meanCount + 2 * Math.Sqrt(Math.Max(meanCount, 1)) && curCount >= meanCount + 3)
            {
                items.Add(new AnomalyItemDto
                {
                    Key = $"cat-freq:{g.Key}:{monthKey}",
                    Type = "frequency_spike",
                    Severity = curCount >= meanCount * 2.5 + 3 ? "high" : "medium",
                    CategoryName = name,
                    CategoryId = g.Key,
                    CurrentAmount = Math.Round((decimal)curSum, 0),
                    NormalAmount = Math.Round((decimal)mean, 0),
                    DeviationPercent = meanCount > 0 ? Math.Round((curCount / meanCount - 1) * 100, 0) : 100,
                    CurrentCount = curCount,
                    NormalCount = Math.Round(meanCount, 1),
                    Reason = "İşlem sıklığı arttı",
                    Explanation =
                        $"Bu ay {name} kategorisinde {curCount} işlem yaptın; önceki aylarda aynı dönemde ortalama " +
                        $"{meanCount.ToString("0.#", Tr)} işlem vardı.",
                    DetectionMethods = new List<string> { "Poisson sıklık testi" },
                });
            }
        }

        return items;
    }

    private static string Fmt(decimal n) => $"{n.ToString("N0", Tr)} ₺";

    private sealed class TxFeatures
    {
        [VectorType(6)]
        public float[] Features { get; set; } = Array.Empty<float>();
    }

    private sealed class KMeansOutput
    {
        [ColumnName("Score")]
        public float[]? Distances { get; set; }
    }

    private sealed class PcaOutput
    {
        public float Score { get; set; }
        public bool PredictedLabel { get; set; }
    }
}
