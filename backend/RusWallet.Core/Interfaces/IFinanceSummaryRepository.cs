using RusWallet.Core.Entities;
using System.Threading.Tasks;

namespace RusWallet.Core.Interfaces
{
    public interface IFinanceSummaryRepository
    {
        Task<FinanceSummary?> GetByUserIdAsync(int userId);
        Task AddAsync(FinanceSummary summary);
        Task UpdateAsync(FinanceSummary summary);
    }
}