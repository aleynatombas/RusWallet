using Microsoft.ML;
using Microsoft.ML.Data;
using Microsoft.ML.Transforms.TimeSeries;

namespace RusWallet.Infrastructure.Services;

/// <summary>ML.NET Time Series ile anomali (spike) tespiti.</summary>
public static class MlNetAnomalyService
{
    private static readonly MLContext MlContext = new(seed: 0);

    /// <summary>Zaman serisinin son noktasının spike (anomali) olup olmadığını ML.NET IID Spike Detector ile tespit eder.</summary>
    /// <param name="series">Kronolojik sırada değerler (en eski ilk); son eleman kontrol edilir.</param>
    /// <param name="confidence">Güven eşiği (0–100, örn. 95).</param>
    /// <returns>Son nokta spike ise true.</returns>
    public static bool IsLastPointSpike(IReadOnlyList<decimal> series, double confidence = 95.0)
    {
        if (series == null || series.Count < 4)
            return false;

        try
        {
            var data = series.Select(v => new TimeSeriesValueRow { Value = (float)v }).ToList();
            var dataView = MlContext.Data.LoadFromEnumerable(data);
            int historyLength = Math.Max(3, Math.Min(series.Count - 1, 30));

            var pipeline = MlContext.Transforms.DetectIidSpike(
                outputColumnName: nameof(IidSpikePredictionRow.Prediction),
                inputColumnName: nameof(TimeSeriesValueRow.Value),
                confidence,
                historyLength);

            var model = pipeline.Fit(dataView);
            var transformed = model.Transform(dataView);
            var predictions = MlContext.Data.CreateEnumerable<IidSpikePredictionRow>(transformed, reuseRowObject: false).ToList();
            if (predictions.Count == 0) return false;

            var last = predictions[^1];
            return last.Prediction != null && last.Prediction.Length > 0 && last.Prediction[0] == 1.0;
        }
        catch
        {
            return false;
        }
    }

    private class TimeSeriesValueRow
    {
        public float Value { get; set; }
    }

    private class IidSpikePredictionRow
    {
        [VectorType(3)]
        public double[]? Prediction { get; set; }
    }
}
