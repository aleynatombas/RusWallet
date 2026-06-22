using Microsoft.Extensions.Configuration;
using OpenAI.Chat;
using RusWallet.Core.Interfaces;

namespace RusWallet.API.Services;

/// <summary>
/// Ay sonu kokpit kartı için OpenAI ile dinamik koçluk mesajı.
/// API anahtarı yoksa veya hata olursa kural tabanlı servise düşer.
/// </summary>
public sealed class OpenAICockpitMonthEndInsightService : ICockpitMonthEndInsightService
{
    private readonly ICockpitMonthEndInsightService _fallback;
    private readonly string? _apiKey;
    private const string DefaultModel = "gpt-4o-mini";

    public OpenAICockpitMonthEndInsightService(
        IConfiguration configuration,
        ICockpitMonthEndInsightService fallback)
    {
        _fallback = fallback;
        _apiKey = configuration["OpenAI:ApiKey"]?.Trim();
    }

    public async Task<string> GenerateShortMessageAsync(MonthEndInsightContext context, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
            return await _fallback.GenerateShortMessageAsync(context, cancellationToken);

        try
        {
            var client = new ChatClient(DefaultModel, _apiKey);
            var systemPrompt = """
                Sen RusWallet uygulamasının finans koçusun. Kullanıcıya ay sonu harcama tahmini hakkında 1-2 cümle Türkçe, net ve yapıcı geri bildirim ver.
                Kurallar:
                - Verilen rakamları uydurma; sadece bağlamdaki sayıları kullan.
                - Yargılayıcı olma; eylem odaklı öner (tempo düşür, sabit giderleri gözden geçir vb.).
                - Maksimum 2 cümle, toplam ~220 karakter.
                - Yatırım tavsiyesi verme.
                """;

            var userPrompt = $"""
                Ay sonu tahmini bağlamı:
                - Bu ay sonu projeksiyon: {context.ProjectedMonthTotal:N0} ₺
                - Gelecek ay öngörüsü: {(context.ForecastNextMonthTotal.HasValue ? $"{context.ForecastNextMonthTotal:N0} ₺" : "yok")}
                - Kalan gün: {context.DaysRemainingInMonth}
                - Esnek pay doluluğu: %{context.BudgetFillPercent}
                - Tempo yüksek mi: {(context.IsOverPaceVersusDisposable ? "evet" : "hayır")}
                - Sabit+esnek model kullanıldı mı: {(context.ProjectedUsesFixedPlusFlexibleSplit ? "evet" : "hayır")}
                - Tahmin kaynağı: {context.PredictionSource}
                - Güven: %{context.PredictionConfidencePercent}
                """;

            var messages = new List<ChatMessage>
            {
                new SystemChatMessage(systemPrompt),
                new UserChatMessage(userPrompt),
            };

            var result = await client.CompleteChatAsync(messages, cancellationToken: cancellationToken);
            var text = result.Value.Content?.Count > 0 ? result.Value.Content[0].Text?.Trim() : null;
            if (!string.IsNullOrWhiteSpace(text) && text.Length <= 400)
                return text;
        }
        catch
        {
            // fallback
        }

        return await _fallback.GenerateShortMessageAsync(context, cancellationToken);
    }
}
