using RusWallet.Core.DTOs.Finance;

namespace RusWallet.Core.Interfaces
{
    public interface IFinanceAnalysisService
    {
        Task<FinanceSummaryResponseDto> GetSummaryAsync(int userId);
    }
}
