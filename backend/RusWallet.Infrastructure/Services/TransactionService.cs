using RusWallet.Core.DTOs.Transaction;
using RusWallet.Core.Interfaces;
using RusWallet.Core.Entities;

namespace RusWallet.Infrastructure.Services
{
    public class TransactionService : ITransactionService
    {
        private readonly ITransactionRepository _transactionRepository;
        private readonly ICategoryRepository _categoryRepository;

        public TransactionService(ITransactionRepository transactionRepository, ICategoryRepository categoryRepository)
        {
            _transactionRepository = transactionRepository;
            _categoryRepository = categoryRepository;
        }

        public async Task AddTransactionAsync(int userId, TransactionCreateDto dto)
        {
            var category = await _categoryRepository.GetByIdAsync(dto.CategoryId);
            if (category == null || category.UserId != userId)
                throw new InvalidOperationException("Geçersiz kategori. Lütfen önce GET /api/category ile kendi kategorilerinizi listeleyin ve listedeki bir CategoryId kullanın.");

            var transaction = new Transaction
            {
                Amount = dto.Amount,
                Description = dto.Description,
                TransactionDate = dto.TransactionDate,
                IsIncome = dto.IsIncome,
                CategoryId = dto.CategoryId,
                UserId = userId,
            };
            await _transactionRepository.AddAsync(transaction);
        }

        public async Task<List<TransactionResponseDto>> GetUserTransactionsAsync(int userId, DateTime? start, DateTime? end)
        {
            List<Transaction> transactions;
            if (start.HasValue || end.HasValue)
            {
                var from = start ?? DateTime.MinValue;
                var to = end.HasValue ? end.Value.Date.AddDays(1) : DateTime.UtcNow.AddDays(1);
                transactions = await _transactionRepository.GetByUserAndDateRangeAsync(userId, from, to, isIncome: null);
            }
            else
            {
                transactions = await _transactionRepository.GetAllByUserAsync(userId);
            }

            return transactions.Select(x => new TransactionResponseDto
            {
                TransactionId = x.TransactionId,
                Amount = x.Amount,
                Description = x.Description,
                TransactionDate = x.TransactionDate,
                IsIncome = x.IsIncome,
                CategoryId = x.CategoryId,
                CategoryName = x.Category?.Name ?? ""
            }).ToList();
        }
    }
}  

