using RusWallet.Core.DTOs.Finance;
using RusWallet.Core.Interfaces;

namespace RusWallet.Infrastructure.Services
{
    public class FinanceAnalysisService : IFinanceAnalysisService
    {
        private readonly ITransactionRepository _transactionRepository;

        public FinanceAnalysisService(ITransactionRepository transactionRepository)
        {
            _transactionRepository = transactionRepository;
        }

        public async Task<FinanceSummaryResponseDto> GetSummaryAsync(int userId)
        {
            var transactions = await _transactionRepository.GetAllByUserAsync(userId);

            var totalIncome = transactions.Where(x => x.IsIncome).Sum(x => x.Amount);
            var totalExpense = transactions.Where(x => !x.IsIncome).Sum(x => x.Amount);
            var balance = totalIncome - totalExpense;

            return new FinanceSummaryResponseDto
            {
                TotalIncome = totalIncome,
                TotalExpense = totalExpense,
                Balance = balance
            };
        }
    }
}