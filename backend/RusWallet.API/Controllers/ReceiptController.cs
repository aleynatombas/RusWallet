using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RusWallet.Core.DTOs.Receipt;
using RusWallet.Core.DTOs.Voice;
using RusWallet.Core.Interfaces;

namespace RusWallet.API.Controllers;

/// <summary>Fiş: foto yükle → OCR; ses: transkript → aynı onay DTO'su. İşlem ekleme frontend'de.</summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReceiptController : ControllerBase
{
    private readonly IReceiptAnalysisService _receiptAnalysisService;
    private readonly IVoiceTransactionParser _voiceTransactionParser;
    private readonly IAIService _aiService;
    private readonly ICategoryService _categoryService;

    public ReceiptController(
        IReceiptAnalysisService receiptAnalysisService,
        IVoiceTransactionParser voiceTransactionParser,
        IAIService aiService,
        ICategoryService categoryService)
    {
        _receiptAnalysisService = receiptAnalysisService;
        _voiceTransactionParser = voiceTransactionParser;
        _aiService = aiService;
        _categoryService = categoryService;
    }

    /// <summary>Cihazda ses→metin sonrası gönderilen metin; tutar ve kategori önerisi döner (Voice/parse ile aynı iş).</summary>
    [HttpPost("parse-voice")]
    [ProducesResponseType(typeof(ReceiptExtractResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ReceiptExtractResponseDto>> ParseVoice([FromBody] VoiceParseRequestDto dto)
    {
        var idClaim = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
        var userId = int.Parse(idClaim);

        if (string.IsNullOrWhiteSpace(dto.Text))
            return BadRequest("Metin boş olamaz.");

        var extraction = _voiceTransactionParser.TryParseTranscript(dto.Text.Trim(), out var err);
        if (extraction is null)
            return BadRequest(err ?? "Metin işlenemedi.");

        var prediction = await _aiService.PredictCategoryAsync(dto.Text.Trim());
        var categoryName = NormalizeCategoryName(prediction.PredictedCategoryName);
        var suggestedIsIncome = prediction.IsIncome || extraction.IsIncome;
        categoryName = HarmonizeCategoryForIncomeFlag(categoryName, suggestedIsIncome);

        var categoryId = await _categoryService.GetOrCreateCategoryIdAsync(userId, categoryName, suggestedIsIncome);

        return Ok(new ReceiptExtractResponseDto
        {
            Extraction = extraction,
            SuggestedCategoryName = categoryName,
            SuggestedCategoryId = categoryId,
            SuggestedIsIncome = suggestedIsIncome,
            Source = "voice",
        });
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
        // OCR (dekont/iade) + AI birleşimi: gelir fişleri için kategori de gelir tarafında olmalı
        var suggestedIsIncome = prediction.IsIncome || extraction.IsIncome;
        categoryName = HarmonizeCategoryForIncomeFlag(categoryName, suggestedIsIncome);

        var categoryId = await _categoryService.GetOrCreateCategoryIdAsync(userId, categoryName, suggestedIsIncome);

        return Ok(new ReceiptExtractResponseDto
        {
            Extraction = extraction,
            SuggestedCategoryName = categoryName,
            SuggestedCategoryId = categoryId,
            SuggestedIsIncome = suggestedIsIncome
        });
    }

    /// <summary>
    /// Gelir olarak işaretlenecek işlemde Market gibi gider adı kalmışsa Gelir/Diğer Gelir'e çekilir.
    /// </summary>
    private static string HarmonizeCategoryForIncomeFlag(string categoryName, bool isIncome)
    {
        if (!isIncome)
        {
            if (IsIncomeOnlyCategoryLabel(categoryName))
                return "Diğer";
            return categoryName;
        }

        if (IsExpenseOnlyCategoryLabel(categoryName))
            return "Gelir";
        return categoryName;
    }

    private static bool IsIncomeOnlyCategoryLabel(string name) =>
        name.Equals("Maaş", StringComparison.OrdinalIgnoreCase)
        || name.Equals("Gelir", StringComparison.OrdinalIgnoreCase)
        || name.Equals("Diğer Gelir", StringComparison.OrdinalIgnoreCase);

    private static bool IsExpenseOnlyCategoryLabel(string name) =>
        name.Equals("Market", StringComparison.OrdinalIgnoreCase)
        || name.Equals("Ulaşım", StringComparison.OrdinalIgnoreCase)
        || name.Equals("Faturalar", StringComparison.OrdinalIgnoreCase)
        || name.Equals("Kira", StringComparison.OrdinalIgnoreCase)
        || name.Equals("Yemek", StringComparison.OrdinalIgnoreCase)
        || name.Equals("Giyim", StringComparison.OrdinalIgnoreCase)
        || name.Equals("Sağlık", StringComparison.OrdinalIgnoreCase)
        || name.Equals("Elektronik", StringComparison.OrdinalIgnoreCase);

    private static string NormalizeCategoryName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "Diğer";
        return name.Replace("\\n", "").Replace("\n", "").Replace("\r", "").Trim();
    }
}
