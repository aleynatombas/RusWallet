using RusWallet.Core.Entities;
using RusWallet.Core.Interfaces;
using RusWallet.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace RusWallet.Infrastructure.Repositories
{
    public class TransactionRepository : ITransactionRepository
    {
        private readonly AppDbContext _context;

        public TransactionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Transaction transaction)
        {
            await _context.Transactions.AddAsync(transaction);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Transaction>> GetAllByUserAsync(int userId)
        {
            return await _context.Transactions
                .Where(t => t.UserId == userId)
                .Include(t => t.Category)
                .ToListAsync();
        }

        public async Task<List<Transaction>> GetByUserAndDateRangeAsync(int userId, DateTime from, DateTime to, bool? isIncome = null)
        {
            var query = _context.Transactions
                .Include(t => t.Category)
                .Where(t => t.UserId == userId && t.TransactionDate >= from && t.TransactionDate < to);

            if (isIncome.HasValue)
                query = query.Where(t => t.IsIncome == isIncome.Value);

            return await query.ToListAsync();
        }

        public async Task<Transaction?> GetByIdAsync(int transactionId)
        {
            return await _context.Transactions
                .Include(t => t.Category)
                .FirstOrDefaultAsync(t => t.TransactionId == transactionId);
        }

        public async Task UpdateAsync(Transaction transaction)
        {
            _context.Transactions.Update(transaction);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int transactionId)
        {
            var transaction = await GetByIdAsync(transactionId);
            if (transaction != null)
            {
                _context.Transactions.Remove(transaction);
                await _context.SaveChangesAsync();
            }
        }
    }
}
