using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using OpenAI.Chat;
using RusWallet.Core.DTOs.AI;
using RusWallet.Core.Interfaces;
using RusWallet.Infrastructure.Services;

namespace RusWallet.API.Services;

/// <summary>
/// OpenAI ile kategori önerisi. API anahtarı yoksa veya hata olursa fallback servisi kullanılır.
/// </summary>
public class OpenAICategoryService : IAIService
{
    private readonly IAIService _fallback;
    private readonly string? _apiKey;
    private const string DefaultModel = "gpt-4o-mini";

    public OpenAICategoryService(IConfiguration configuration, KeywordCategoryService fallback)
    {
        _fallback = fallback;
        _apiKey = configuration["OpenAI:ApiKey"]?.Trim();
    }

    public async Task<CategoryPredictionResponseDto> PredictCategoryAsync(string description)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
            return await _fallback.PredictCategoryAsync(description);

        try
        {
            var client = new ChatClient(DefaultModel, _apiKey);
            var systemPrompt = """
                Sen bir harcama/gelir kategorilendirme asistanısın. Verilen işlem açıklamasına göre SADECE aşağıdaki formatta tek satır cevap ver.
                Kategoriler (birebir yaz): Maaş, Market, Ulaşım, Faturalar, Kira, Yemek, Giyim, Sağlık, Gelir, Diğer Gelir, Elektronik, Diğer
                Format (İngilizce): Category: [kategori adı]\nIsIncome: true veya false
                Örnek: "Migros alışverişi" -> Category: Market\nIsIncome: false
                "Aylık maaş" -> Category: Maaş\nIsIncome: true
                """;
            var messages = new List<ChatMessage>
            {
                new SystemChatMessage(systemPrompt),
                new UserChatMessage(description.Length > 500 ? description[..500] : description)
            };
            var result = await client.CompleteChatAsync(messages);
            var completion = result.Value;
            var text = completion.Content?.Count > 0 ? completion.Content[0].Text : null;
            if (string.IsNullOrWhiteSpace(text))
                return await _fallback.PredictCategoryAsync(description);

            var category = "Diğer";
            var isIncome = false;
            var catMatch = Regex.Match(text, @"Category:\s*([^\n]+)", RegexOptions.IgnoreCase);
            if (catMatch.Success)
            {
                category = catMatch.Groups[1].Value.Trim();
                // Model bazen "Elektronik\nIsIncome: false" gibi tek parça döndürüyor; sadece kategori adını al
                var isIncomeIdx = category.IndexOf("IsIncome", StringComparison.OrdinalIgnoreCase);
                if (isIncomeIdx >= 0)
                    category = category[..isIncomeIdx].Trim();
                category = category.TrimEnd('\r', '\n').Trim();
                if (string.IsNullOrWhiteSpace(category)) category = "Diğer";
            }
            var incMatch = Regex.Match(text, @"IsIncome:\s*(true|false)", RegexOptions.IgnoreCase);
            if (incMatch.Success)
                isIncome = string.Equals(incMatch.Groups[1].Value, "true", StringComparison.OrdinalIgnoreCase);

            return new CategoryPredictionResponseDto { PredictedCategoryName = category, IsIncome = isIncome, Source = "OpenAI" };
        }
        catch
        {
            return await _fallback.PredictCategoryAsync(description);
        }
    }
}
