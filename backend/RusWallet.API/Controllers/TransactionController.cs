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

    /// <summary>
    /// İşlem ekle. categoryId verilirse onu kullanır; verilmezse (<=0) description'dan otomatik kategori üretir.
    /// </summary>
    [HttpPost("add")]
    public async Task<IActionResult> Add(TransactionCreateDto dto)
    {
        var idClaim = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
        int userId = int.Parse(idClaim);

        if (dto.Amount <= 0)
            return BadRequest("Tutar 0'dan büyük olmalıdır.");
        if (string.IsNullOrWhiteSpace(dto.Description))
            return BadRequest("Açıklama boş olamaz.");

        // Swagger'da kullanıcı categoryId yazmak istemezse 0/boş gelir.
        // Bu durumda her açıklamanın ayrı kategoriye dönüşmemesi için sabit fallback kategori kullanılır.
        if (dto.CategoryId <= 0)
        {
            var fallbackCategoryName = dto.IsIncome ? "Gelir" : "Gider";

            dto.CategoryId = await _categoryService.GetOrCreateCategoryIdAsync(userId, fallbackCategoryName, dto.IsIncome);
        }

        if (dto.TransactionDate == default)
            dto.TransactionDate = DateTime.Today;

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

    /// <summary>
    /// İşlemleri listele.
    /// period destekleri: 1week, 1month, 6months, 1year, all veya gün sayısı (örn: 7, 30, 90).
    /// start/end verilirse manuel tarih aralığı kullanılır.
    /// Hiç parametre yoksa varsayılan: son 1 ay.
    /// take: en fazla kaç kayıt döndürüleceği (sıra: tarih azalan). Örn. period=all ve take=1 ile son işlem.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] string? period,
        [FromQuery] DateTime? start,
        [FromQuery] DateTime? end,
        [FromQuery] decimal? minAmount,
        [FromQuery] decimal? maxAmount,
        [FromQuery] int? categoryId,
        [FromQuery] string? q,
        [FromQuery] string? paymentMethod,
        [FromQuery] bool? isIncome,
        [FromQuery] int? take)
    {
        var idClaim = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
        int userId = int.Parse(idClaim);

        DateTime? from = start;
        DateTime? toInclusive = end;
        var normalizedPeriod = (period ?? "1month").Trim().ToLowerInvariant();

        if (!start.HasValue && !end.HasValue)
        {
            var today = DateTime.Today;
            if (int.TryParse(normalizedPeriod, out var dayCount) && dayCount > 0)
            {
                from = today.AddDays(-dayCount);
                toInclusive = today;
            }
            else
            {
                switch (normalizedPeriod)
                {
                    case "1week":
                    case "1hafta":
                        from = today.AddDays(-7);
                        toInclusive = today;
                        break;
                    case "1month":
                    case "1ay":
                        from = today.AddMonths(-1);
                        toInclusive = today;
                        break;
                    case "6months":
                    case "6ay":
                        from = today.AddMonths(-6);
                        toInclusive = today;
                        break;
                    case "1year":
                    case "1yil":
                        from = today.AddYears(-1);
                        toInclusive = today;
                        break;
                    case "all":
                    case "tumu":
                        from = null;
                        toInclusive = null;
                        break;
                    default:
                        return BadRequest("period geçerli değil. Kullan: 1week, 1month, 6months, 1year, all veya gün sayısı (7, 30, 90).");
                }
            }
        }
        else
        {
            if (start.HasValue && !end.HasValue)
                toInclusive = DateTime.Today;
            if (!start.HasValue && end.HasValue)
                from = null;
        }

        var result = await _transactionService.GetUserTransactionsAsync(
            userId,
            from,
            toInclusive,
            minAmount,
            maxAmount,
            categoryId,
            q,
            paymentMethod,
            isIncome,
            take);
        return Ok(result);
    }

    [HttpPatch("{id:int}")]
    public async Task<IActionResult> Patch(int id, [FromBody] TransactionUpdateDto dto)
    {
        var idClaim = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
        int userId = int.Parse(idClaim);
        try
        {
            await _transactionService.UpdateTransactionAsync(userId, id, dto);
            return Ok();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
}