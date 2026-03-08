using RusWallet.Core.Entities;
using RusWallet.Core.Interfaces;
using RusWallet.Core.DTOs.Prediction;

namespace RusWallet.Infrastructure.Services
{
    public class PredictionService : IPredictionService
    {
        private readonly ITransactionRepository _transactionRepository;
        private readonly IPredictionRepository _predictionRepository;

        public PredictionService(ITransactionRepository transactionRepository, IPredictionRepository predictionRepository)
        {
            _transactionRepository = transactionRepository;
            _predictionRepository = predictionRepository;
        }

        public async Task<PredictionResponseDto> GetMonthlyPredictionAsync(int userId, DateTime month)
        {
            // Son 6 ay verisi ile ML (linear regression) tahmini; daha az veri varsa ortalama kullanılır
            var sixMonthsAgo = month.AddMonths(-6);
            var transactions = await _transactionRepository.GetByUserAndDateRangeAsync(userId, sixMonthsAgo, month, isIncome: false);

            var orderedMonthlyTotals = transactions
                .GroupBy(x => new { x.TransactionDate.Year, x.TransactionDate.Month })
                .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                .Select(g => g.Sum(x => x.Amount))
                .ToList();

            decimal estimatedAmount = 0;
            if (orderedMonthlyTotals.Count > 0)
            {
                var mlNetPrediction = MlNetForecastService.PredictNextMonth(orderedMonthlyTotals);
                estimatedAmount = mlNetPrediction ?? MLPredictionHelper.PredictNextByLinearRegression(orderedMonthlyTotals);
            }

            var prediction = new Prediction
            {
                UserId = userId,
                PredictedAmount = estimatedAmount,
                PredictedMonth = month,
                CreatedAt = DateTime.UtcNow
            };
            await _predictionRepository.AddAsync(prediction);

            return new PredictionResponseDto
            {
                EstimatedAmount = estimatedAmount,
                PredictedMonth = month,
                Message = $"Tahmini harcamanız {estimatedAmount} TL olacaktır."
            };
        }
    }
}