using RusWallet.Core.Entities;
using RusWallet.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using RusWallet.Infrastructure.Data;

namespace RusWallet.Infrastructure.Repositories
{
    public class PredictionRepository : IPredictionRepository
    {
        private readonly AppDbContext _context;

        public PredictionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Prediction prediction)
        {
            await _context.Predictions.AddAsync(prediction);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Prediction>> GetByUserIdAsync(int userId)
        {
            return await _context.Predictions
                                 .Where(p => p.UserId == userId)
                                 .ToListAsync();
        }

        public async Task<Prediction?> GetLatestByUserIdAsync(int userId)
        {
            return await _context.Predictions
                                 .Where(p => p.UserId == userId)
                                 .OrderByDescending(p => p.PredictedMonth)
                                 .FirstOrDefaultAsync();
        }
    }
}