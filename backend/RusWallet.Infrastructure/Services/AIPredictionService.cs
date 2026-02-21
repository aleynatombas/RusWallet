using Microsoft.EntityFrameworkCore;
using RusWallet.Core.Entities;
using RusWallet.Core.Interfaces;
using RusWallet.Infrastructure.Data;
using RusWallet.Core.DTOs.Prediction;
using Microsoft.Extensions.Configuration;

namespace RusWallet.Infrastructure.Services
{
    public class PredictionService : IPredictionService
    {
        private readonly AppDbContext _context;

        private readonly IConfiguration _config;

public PredictionService(AppDbContext context, IConfiguration config)
{
    _context = context;
    _config = config;
}

        public async Task<PredictionResponseDto> GetMonthlyPredictionAsync(int userId, DateTime month)
        {
            var apiKey = _config["OpenAI:ApiKey"];
            Console.WriteLine("API KEY: " + apiKey);

            var threeMonthsAgo = month.AddMonths(-3);

            var transactions = await _context.Transactions
                .Where(x => x.UserId == userId &&
                            !x.IsIncome &&
                            x.TransactionDate >= threeMonthsAgo &&
                            x.TransactionDate < month)
                .ToListAsync();

            var monthlyTotals = transactions
                .GroupBy(x => new { x.TransactionDate.Year, x.TransactionDate.Month })
                .Select(g => g.Sum(x => x.Amount))
                .ToList();

            decimal estimatedAmount = 0;

            if (monthlyTotals.Count > 0)
                estimatedAmount = monthlyTotals.Average();

            // 🔥 Prediction entity oluşturuyoruz
            var prediction = new Prediction
            {
                UserId = userId,
                PredictedAmount = estimatedAmount,
                PredictedMonth = month,
                CreatedAt = DateTime.UtcNow
            };

            _context.Predictions.Add(prediction);
            await _context.SaveChangesAsync();

            return new PredictionResponseDto
            {
                EstimatedAmount = estimatedAmount,
                PredictedMonth = month,
                Message = $"Tahmini harcamanız {estimatedAmount} TL olacaktır."
            };
        }
    }
}