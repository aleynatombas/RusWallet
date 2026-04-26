using RusWallet.Core.DTOs.Transaction;

namespace RusWallet.Core.Interfaces
{
    public interface ITransactionService
    {
        Task AddTransactionAsync(int userId, TransactionCreateDto dto);

        Task<List<TransactionResponseDto>> GetUserTransactionsAsync(
            int userId,
            DateTime? start,
            DateTime? end,
            decimal? minAmount,
            decimal? maxAmount,
            int? categoryId,
            string? keyword,
            string? paymentMethodContains,
            bool? isIncome,
            int? take = null);

        Task UpdateTransactionAsync(int userId, int transactionId, TransactionUpdateDto dto);
    }
}
