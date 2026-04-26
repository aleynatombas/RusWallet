using RusWallet.Core.Entities;
using RusWallet.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using RusWallet.Infrastructure.Data;

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
                .Include(t => t.Category)
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.TransactionDate)
                .ToListAsync();
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

        public async Task<List<Transaction>> GetByUserAndDateRangeAsync(
            int userId,
            DateTime from,
            DateTime to,
            bool? isIncome = null)
        {
            var query = _context.Transactions
                .Include(t => t.Category)
                .Where(t => t.UserId == userId)
                .Where(t => t.TransactionDate >= from && t.TransactionDate < to);

            if (isIncome.HasValue)
                query = query.Where(t => t.IsIncome == isIncome.Value);

            return await query
                .OrderByDescending(t => t.TransactionDate)
                .ToListAsync();
        }

        public async Task<List<Transaction>> SearchAsync(
            int userId,
            DateTime? from,
            DateTime? toExclusive,
            decimal? minAmount,
            decimal? maxAmount,
            int? categoryId,
            string? keyword,
            string? paymentMethodContains,
            bool? isIncome,
            int? take = null)
        {
            var query = _context.Transactions
                .Include(t => t.Category)
                .Where(t => t.UserId == userId);

            if (from.HasValue)
                query = query.Where(t => t.TransactionDate >= from.Value);

            if (toExclusive.HasValue)
                query = query.Where(t => t.TransactionDate < toExclusive.Value);

            if (minAmount.HasValue)
                query = query.Where(t => t.Amount >= minAmount.Value);

            if (maxAmount.HasValue)
                query = query.Where(t => t.Amount <= maxAmount.Value);

            if (categoryId.HasValue && categoryId.Value > 0)
                query = query.Where(t => t.CategoryId == categoryId.Value);

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var k = keyword.Trim();
                query = query.Where(t => t.Description.Contains(k));
            }

            if (!string.IsNullOrWhiteSpace(paymentMethodContains))
            {
                var p = paymentMethodContains.Trim();
                query = query.Where(t => t.PaymentMethod != null && t.PaymentMethod.Contains(p));
            }

            if (isIncome.HasValue)
                query = query.Where(t => t.IsIncome == isIncome.Value);

            query = query.OrderByDescending(t => t.TransactionDate);

            if (take.HasValue && take.Value > 0)
                return await query.Take(take.Value).ToListAsync();

            return await query.ToListAsync();
        }
    }

}
