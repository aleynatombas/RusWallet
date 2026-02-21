using Microsoft.EntityFrameworkCore;
using RusWallet.Core.DTOs.Finance;
using RusWallet.Core.Entities;
using RusWallet.Core.Interfaces;
using RusWallet.Infrastructure.Data;

namespace RusWallet.Infrastructure.Services
{
    public class FinanceAnalysisService : IFinanceAnalysisService
    {
        private readonly AppDbContext _context;

        public FinanceAnalysisService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<FinanceSummaryResponseDto> GetSummaryAsync(int userId)
        {
            var transaction = await _context.Transactions
            .Where (x => x.UserId== userId)
            .ToListAsync();

            var totalIncome = transaction
            .Where(x => x.IsIncome)
            .Sum(x => x.Amount);

            var totalExpense = transaction
            .Where (x => !x.IsIncome)
            .Sum (x => x.Amount);

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