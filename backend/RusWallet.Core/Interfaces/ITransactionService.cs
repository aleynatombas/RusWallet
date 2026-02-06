using RusWallet.Core.DTOs.Transaction;

namespace RusWallet.Core.Interfaces
{
    public interface ITransactionService
    {
        Task AddTransactionAsync(int userId, TransactionCreateDto dto);

        Task<List<TransactionResponseDto>> GetUserTransactionsAsync(int userId);
    }
}
