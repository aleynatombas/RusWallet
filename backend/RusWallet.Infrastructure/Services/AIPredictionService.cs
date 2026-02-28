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
            var threeMonthsAgo = month.AddMonths(-3);

            var transactions = await _transactionRepository.GetByUserAndDateRangeAsync(userId, threeMonthsAgo, month, isIncome: false);

            var monthlyTotals = transactions
                .GroupBy(x => new { x.TransactionDate.Year, x.TransactionDate.Month })
                .Select(g => g.Sum(x => x.Amount))
                .ToList();

            decimal estimatedAmount = monthlyTotals.Count > 0 ? monthlyTotals.Average() : 0;

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