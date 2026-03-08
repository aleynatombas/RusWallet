using Microsoft.AspNetCore.Mvc;
using RusWallet.Core.DTOs.Transaction;
using RusWallet.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace RusWallet.API.Controllers
{
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransactionController : ControllerBase
{
    private readonly ITransactionService _transactionService;
    private readonly ICategoryService _categoryService;

    public TransactionController(ITransactionService transactionService, ICategoryService categoryService)
    {
        _transactionService = transactionService;
        _categoryService = categoryService;
    }

    /// <summary>Kategori id + diğer alanlarla işlem ekle (mevcut kategori listesinden seçince).</summary>
    [HttpPost("add")]
    public async Task<IActionResult> Add(TransactionCreateDto dto)
    {
        var idClaim = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
        int userId = int.Parse(idClaim);

        try
        {
            await _transactionService.AddTransactionAsync(userId, dto);
            return Ok();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>Manuel: kategori adı + fiyat + gelir/gider girilir; kategori yoksa oluşturulur, işlem kaydedilir.</summary>
    [HttpPost("add-manual")]
    public async Task<IActionResult> AddManual([FromBody] AddTransactionManualDto dto)
    {
        var idClaim = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
        int userId = int.Parse(idClaim);

        if (string.IsNullOrWhiteSpace(dto.CategoryName))
            return BadRequest("Kategori adı boş olamaz.");
        if (dto.Amount <= 0)
            return BadRequest("Tutar 0'dan büyük olmalıdır.");

        int categoryId = await _categoryService.GetOrCreateCategoryIdAsync(userId, dto.CategoryName.Trim(), dto.IsIncome);
        var transactionDto = new TransactionCreateDto
        {
            Amount = dto.Amount,
            Description = string.IsNullOrWhiteSpace(dto.Description) ? dto.CategoryName.Trim() : dto.Description.Trim(),
            TransactionDate = dto.TransactionDate ?? DateTime.Today,
            IsIncome = dto.IsIncome,
            CategoryId = categoryId
        };

        try
        {
            await _transactionService.AddTransactionAsync(userId, transactionDto);
            return Ok();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>İşlemleri listele. period ile: 1month, 6months, 1year, all. Veya start/end ile manuel tarih.</summary>
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] string? period,
        [FromQuery] DateTime? start,
        [FromQuery] DateTime? end)
    {
        var idClaim = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
        int userId = int.Parse(idClaim);

        DateTime? from = start;
        DateTime? to = end;

        if (!string.IsNullOrWhiteSpace(period))
        {
            var today = DateTime.Today;
            switch (period.Trim().ToLowerInvariant())
            {
                case "1month":
                case "1ay":
                    from = today.AddMonths(-1);
                    to = today;
                    break;
                case "6months":
                case "6ay":
                    from = today.AddMonths(-6);
                    to = today;
                    break;
                case "1year":
                case "1yil":
                    from = today.AddYears(-1);
                    to = today;
                    break;
                case "all":
                case "tumu":
                    from = null;
                    to = null;
                    break;
                default:
                    return BadRequest("period geçerli değil. Kullan: 1month, 6months, 1year, all");
            }
        }

        var result = await _transactionService.GetUserTransactionsAsync(userId, from, to);
        return Ok(result);
    }
}
}