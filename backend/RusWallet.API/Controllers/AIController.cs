using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RusWallet.Core.DTOs.AI;
using RusWallet.Core.DTOs.Transaction;
using RusWallet.Core.Interfaces;

namespace RusWallet.API.Controllers
{
    /// <summary>
    /// AI destekli özellikler: kategori önerisi, açıklama + tutar ile işlem kaydetme.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AIController : ControllerBase
    {
        private readonly IAIService _aiService;
        private readonly ICategoryService _categoryService;
        private readonly ITransactionService _transactionService;

        public AIController(IAIService aiService, ICategoryService categoryService, ITransactionService transactionService)
        {
            _aiService = aiService;
            _categoryService = categoryService;
            _transactionService = transactionService;
        }

        /// <summary>Tek AI endpoint: sadece açıklama + fiyat. AI kategori ve gelir/gideri otomatik seçer, tarih bugün, işlem kaydedilir.</summary>
        [HttpPost("add-transaction-with-ai")]
        public async Task<ActionResult<AddTransactionWithAiResponseDto>> AddTransactionWithAi([FromBody] AddTransactionWithAiRequestDto dto)
        {
            var idClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
            int userId = int.Parse(idClaim);

            if (string.IsNullOrWhiteSpace(dto.Description))
                return BadRequest("Açıklama boş olamaz.");
            if (dto.Amount <= 0)
                return BadRequest("Tutar 0'dan büyük olmalıdır.");

            var prediction = await _aiService.PredictCategoryAsync(dto.Description.Trim());
            int categoryId = await _categoryService.GetOrCreateCategoryIdAsync(userId, prediction.PredictedCategoryName, prediction.IsIncome);

            var today = DateTime.Today;
            var transactionDto = new TransactionCreateDto
            {
                Amount = dto.Amount,
                Description = dto.Description.Trim(),
                TransactionDate = today,
                IsIncome = prediction.IsIncome,
                CategoryId = categoryId
            };

            try
            {
                await _transactionService.AddTransactionAsync(userId, transactionDto);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }

            return Ok(new AddTransactionWithAiResponseDto
            {
                CategoryId = categoryId,
                CategoryName = prediction.PredictedCategoryName,
                IsIncome = prediction.IsIncome,
                Amount = dto.Amount,
                TransactionDate = today,
                Source = prediction.Source
            });
        }
    }
}
