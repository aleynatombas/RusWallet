using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RusWallet.Core.DTOs.Receipt;
using RusWallet.Core.Interfaces;

namespace RusWallet.API.Controllers;

/// <summary>Fiş: foto yükle → OCR ile metin ve alanlar (vendor, tarih, toplam) + önerilen kategori döner. Düzenleme ve işlem ekleme frontend'de.</summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReceiptController : ControllerBase
{
    private readonly IReceiptAnalysisService _receiptAnalysisService;
    private readonly IAIService _aiService;
    private readonly ICategoryService _categoryService;

    public ReceiptController(
        IReceiptAnalysisService receiptAnalysisService,
        IAIService aiService,
        ICategoryService categoryService)
    {
        _receiptAnalysisService = receiptAnalysisService;
        _aiService = aiService;
        _categoryService = categoryService;
    }

    /// <summary>Fiş fotoğrafı yüklenir; OCR ile metin ve alanlar (satıcı, tarih, toplam) çıkarılır, AI ile kategori önerilir. İşlem oluşturulmaz.</summary>
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ReceiptExtractResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ReceiptExtractResponseDto>> Upload(IFormFile file, CancellationToken cancellationToken = default)
    {
        var idClaim = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
        var userId = int.Parse(idClaim);

        if (file == null || file.Length == 0)
            return BadRequest("Lütfen bir görsel dosyası yükleyin.");

        var allowed = new[] { "image/jpeg", "image/png", "image/webp", "image/bmp" };
        var contentType = file.ContentType?.ToLowerInvariant() ?? "";
        if (!allowed.Contains(contentType))
            return BadRequest("Desteklenen formatlar: JPEG, PNG, WebP, BMP.");

        await using var stream = file.OpenReadStream();
        var extraction = await _receiptAnalysisService.ExtractFromImageAsync(stream, file.FileName, cancellationToken);

        var description = string.IsNullOrWhiteSpace(extraction.VendorName) ? "Fiş" : $"Fiş: {extraction.VendorName}";
        if (!string.IsNullOrWhiteSpace(extraction.RawText))
        {
            var snippet = extraction.RawText.Length > 300 ? extraction.RawText[..300] : extraction.RawText;
            description += " " + snippet;
        }

        var prediction = await _aiService.PredictCategoryAsync(description);
        var categoryName = NormalizeCategoryName(prediction.PredictedCategoryName);
        var categoryId = await _categoryService.GetOrCreateCategoryIdAsync(userId, categoryName, isIncome: false);

        return Ok(new ReceiptExtractResponseDto
        {
            Extraction = extraction,
            SuggestedCategoryName = categoryName,
            SuggestedCategoryId = categoryId
        });
    }

    private static string NormalizeCategoryName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "Diğer";
        return name.Replace("\\n", "").Replace("\n", "").Replace("\r", "").Trim();
    }
}
