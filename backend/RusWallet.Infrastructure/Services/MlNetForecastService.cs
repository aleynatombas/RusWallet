using Microsoft.ML;
using Microsoft.ML.Data;

namespace RusWallet.Infrastructure.Services;

/// <summary>ML.NET ile aylık harcama tahmini (OLS regresyon).</summary>
public class MlNetForecastService
{
    private static readonly MLContext MlContext = new(seed: 0);

    /// <summary>Son N aylık toplamları kullanarak bir sonraki ayı ML.NET regresyon ile tahmin eder.</summary>
    /// <param name="monthlyTotals">Kronolojik sırada aylık gider toplamları (en eski ilk).</param>
    /// <returns>Tahmin edilen bir sonraki ay tutarı. Veri yetersizse null (fallback kullanılır).</returns>
    public static decimal? PredictNextMonth(IReadOnlyList<decimal> monthlyTotals)
    {
        if (monthlyTotals == null || monthlyTotals.Count < 2)
            return null;

        try
        {
            var data = monthlyTotals
                .Select((amount, i) => new MonthlyExpenseRow { MonthIndex = i, Amount = (float)amount })
                .ToList();

            var dataView = MlContext.Data.LoadFromEnumerable(data);
            // Features vektörü: tek özellik (MonthIndex); SDCA regresyon ile trend tahmini
            var pipeline = MlContext.Transforms.Concatenate("Features", nameof(MonthlyExpenseRow.MonthIndex))
                .Append(MlContext.Regression.Trainers.Sdca(
                    labelColumnName: nameof(MonthlyExpenseRow.Amount),
                    featureColumnName: "Features",
                    maximumNumberOfIterations: 100));

            var model = pipeline.Fit(dataView);
            var engine = MlContext.Model.CreatePredictionEngine<MonthlyExpenseRow, MonthlyExpensePrediction>(model);

            int nextIndex = data.Count;
            var prediction = engine.Predict(new MonthlyExpenseRow { MonthIndex = nextIndex, Amount = 0 });
            var value = (decimal)prediction.PredictedAmount;
            return value > 0 ? value : (decimal?)null;
        }
        catch
        {
            return null;
        }
    }

    private class MonthlyExpenseRow
    {
        public float MonthIndex { get; set; }
        public float Amount { get; set; }
    }

    private class MonthlyExpensePrediction
    {
        [ColumnName("Score")]
        public float PredictedAmount { get; set; }
    }
}
