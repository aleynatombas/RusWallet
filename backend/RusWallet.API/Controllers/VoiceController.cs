using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RusWallet.Core.DTOs.Receipt;
using RusWallet.Core.DTOs.Voice;
using RusWallet.Core.Interfaces;

namespace RusWallet.API.Controllers;

/// <summary>Ses→metin sonrası doğal dilden tutar ve açıklama çıkarır; fiş akışıyla aynı onay DTO'su.</summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VoiceController : ControllerBase
{
    private readonly IVoiceTransactionParser _voiceParser;
    private readonly IAIService _aiService;
    private readonly ICategoryService _categoryService;

    public VoiceController(
        IVoiceTransactionParser voiceParser,
        IAIService aiService,
        ICategoryService categoryService)
    {
        _voiceParser = voiceParser;
        _aiService = aiService;
        _categoryService = categoryService;
    }

    /// <summary>Transkripti işler; kategori önerisi ve kullanıcıya özel kategori id döner. İşlem oluşturulmaz.</summary>
    [HttpPost("parse")]
    [ProducesResponseType(typeof(ReceiptExtractResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ReceiptExtractResponseDto>> Parse([FromBody] VoiceParseRequestDto dto)
    {
        var idClaim = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
        var userId = int.Parse(idClaim);

        if (string.IsNullOrWhiteSpace(dto.Text))
            return BadRequest("Metin boş olamaz.");

        var extraction = _voiceParser.TryParseTranscript(dto.Text.Trim(), out var err);
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
