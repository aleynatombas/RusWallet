using RusWallet.Core.Entities;
using RusWallet.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using RusWallet.Infrastructure.Data;
using System.Threading.Tasks;

namespace RusWallet.Infrastructure.Repositories
{
    public class FinanceSummaryRepository : IFinanceSummaryRepository
    {
        private readonly AppDbContext _context;

        public FinanceSummaryRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<FinanceSummary?> GetByUserIdAsync(int userId)
        {
            return await _context.FinanceSummaries
                                 .FirstOrDefaultAsync(f => f.UserId == userId);
        }

        public async Task AddAsync(FinanceSummary summary)
        {
            await _context.FinanceSummaries.AddAsync(summary);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(FinanceSummary summary)
        {
            _context.FinanceSummaries.Update(summary);
            await _context.SaveChangesAsync();
        }
    }
}