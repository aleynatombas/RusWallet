using Microsoft.Extensions.Configuration;
using OpenAI.Chat;
using RusWallet.Core.DTOs.AI;
using RusWallet.Core.Interfaces;
using RusWallet.Infrastructure.Services;

namespace RusWallet.API.Services;

/// <summary>
/// Chatbot yanıtları için OpenAI kullanır. API anahtarı yoksa veya hata olursa FAQ (kelime tabanlı) servisine düşer.
/// </summary>
public class OpenAIChatbotService : IChatbotService
{
    private readonly IChatbotService _fallback;
    private readonly string? _apiKey;
    private const string DefaultModel = "gpt-4o-mini";

    public OpenAIChatbotService(IConfiguration configuration, FAQChatbotService fallback)
    {
        _fallback = fallback;
        _apiKey = configuration["OpenAI:ApiKey"]?.Trim();
    }

    public async Task<ChatResponseDto> AskAsync(string message)
    {
        if (string.IsNullOrWhiteSpace(message))
            return new ChatResponseDto { Response = "Lütfen bir soru yazın.", Source = "FAQ" };

        if (string.IsNullOrWhiteSpace(_apiKey))
            return await _fallback.AskAsync(message);

        try
        {
            var client = new ChatClient(DefaultModel, _apiKey);
            var systemPrompt = """
                Sen RusWallet uygulamasının bütçe asistanısın. Kullanıcılar gelir-gider takibi, kategoriler, tasarruf, yatırım, borç yönetimi, acil fon, bütçe planlama, fiş yükleme gibi konularda soru sorabilir.
                Her zaman Türkçe, kısa ve anlaşılır cevap ver. Yatırım/borç/tasarruf tavsiyesi verirken "Bu bilgi genel bilgilendirme amaçlıdır, yatırım tavsiyesi değildir" benzeri bir uyarı ekle.
                Uygulama özellikleri: işlem ekleme, kategori önerisi (açıklamaya göre), fiş fotoğrafı yükleme (OCR), analiz özeti, aylık tahmin, chatbot. Soru konu dışıysa kibarca bütçe/harcama konularına yönlendir.
                """;
            var messages = new List<ChatMessage>
            {
                new SystemChatMessage(systemPrompt),
                new UserChatMessage(message.Trim().Length > 2000 ? message.Trim()[..2000] : message.Trim())
            };
            var result = await client.CompleteChatAsync(messages);
            var text = result.Value.Content?.Count > 0 ? result.Value.Content[0].Text : null;
            if (!string.IsNullOrWhiteSpace(text))
                return new ChatResponseDto { Response = text.Trim(), Source = "OpenAI" };
        }
        catch
        {
            // fallback
        }

        return await _fallback.AskAsync(message);
    }
}
