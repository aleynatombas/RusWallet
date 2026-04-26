using RusWallet.Core.DTOs.Transaction;
using RusWallet.Core.Interfaces;
using RusWallet.Core.Entities;

namespace RusWallet.Infrastructure.Services
{
    public class TransactionService : ITransactionService
    {
        private readonly ITransactionRepository _transactionRepository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly IOnboardingService _onboardingService;

        public TransactionService(
            ITransactionRepository transactionRepository,
            ICategoryRepository categoryRepository,
            IOnboardingService onboardingService)
        {
            _transactionRepository = transactionRepository;
            _categoryRepository = categoryRepository;
            _onboardingService = onboardingService;
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
                PaymentMethod = string.IsNullOrWhiteSpace(dto.PaymentMethod) ? null : dto.PaymentMethod.Trim(),
            };
            await _transactionRepository.AddAsync(transaction);
        }

        public async Task<List<TransactionResponseDto>> GetUserTransactionsAsync(
            int userId,
            DateTime? start,
            DateTime? endInclusive,
            decimal? minAmount,
            decimal? maxAmount,
            int? categoryId,
            string? keyword,
            string? paymentMethodContains,
            bool? isIncome,
            int? take = null)
        {
            await _onboardingService.SyncProfileBaselinesAsync(userId);

            DateTime? from = start.HasValue ? start.Value.Date : null;
            DateTime? toExclusive = endInclusive.HasValue ? endInclusive.Value.Date.AddDays(1) : null;

            var list = await _transactionRepository.SearchAsync(
                userId,
                from,
                toExclusive,
                minAmount,
                maxAmount,
                categoryId,
                keyword,
                paymentMethodContains,
                isIncome,
                take);

            return list.Select(x => new TransactionResponseDto
            {
                TransactionId = x.TransactionId,
                Amount = x.Amount,
                Description = x.Description,
                TransactionDate = x.TransactionDate,
                IsIncome = x.IsIncome,
                CategoryId = x.CategoryId,
                CategoryName = x.Category?.Name ?? "",
                PaymentMethod = x.PaymentMethod,
            }).ToList();
        }

        public async Task UpdateTransactionAsync(int userId, int transactionId, TransactionUpdateDto dto)
        {
            var hasAmount = dto.Amount.HasValue;
            var hasCategory = dto.CategoryId.HasValue && dto.CategoryId.Value > 0;
            var hasPayment = dto.PaymentMethod != null;

            if (!hasAmount && !hasCategory && !hasPayment)
                throw new InvalidOperationException("Güncellenecek alan yok.");

            var t = await _transactionRepository.GetByIdAsync(transactionId);
            if (t == null || t.UserId != userId)
                throw new InvalidOperationException("İşlem bulunamadı.");

            if (hasAmount)
            {
                if (dto.Amount!.Value <= 0)
                    throw new InvalidOperationException("Tutar 0'dan büyük olmalıdır.");
                t.Amount = dto.Amount.Value;
            }

            if (hasCategory)
            {
                var cat = await _categoryRepository.GetByIdAsync(dto.CategoryId!.Value);
                if (cat == null || cat.UserId != userId)
                    throw new InvalidOperationException("Geçersiz kategori.");
                if (cat.IsIncome != t.IsIncome)
                    throw new InvalidOperationException("Kategori, işlem türü (gelir/gider) ile uyuşmuyor.");
                t.CategoryId = dto.CategoryId.Value;
            }

            if (hasPayment)
                t.PaymentMethod = string.IsNullOrWhiteSpace(dto.PaymentMethod) ? null : dto.PaymentMethod!.Trim();

            await _transactionRepository.UpdateAsync(t);
        }
    }
}
