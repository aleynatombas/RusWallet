using RusWallet.Core.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace RusWallet.Core.Interfaces
{
    public interface ITransactionRepository
    {
        Task AddAsync(Transaction transaction);
        Task<List<Transaction>> GetAllByUserAsync(int userId);
        /// <param name="isIncome">null = tümü, true = sadece gelir, false = sadece gider</param>
        Task<List<Transaction>> GetByUserAndDateRangeAsync(int userId, DateTime from, DateTime to, bool? isIncome = null);
        Task<List<Transaction>> SearchAsync(
            int userId,
            DateTime? from,
            DateTime? toExclusive,
            decimal? minAmount,
            decimal? maxAmount,
            int? categoryId,
            string? keyword,
            string? paymentMethodContains,
            bool? isIncome,
            int? take = null);
        Task<Transaction?> GetByIdAsync(int transactionId);
        Task UpdateAsync(Transaction transaction);
        Task DeleteAsync(int transactionId);
    }
}