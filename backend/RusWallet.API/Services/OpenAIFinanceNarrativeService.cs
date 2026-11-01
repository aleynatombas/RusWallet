using System.Text.Json;
using OpenAI.Chat;
using RusWallet.Core.Interfaces;

namespace RusWallet.API.Services;

/// <summary>
/// Backend'in hesapladığı tahmin ve tasarruf sonuçlarını OpenAI ile Türkçe doğal dilde açıklar.
/// Model hiçbir rakam üretmez: çıktıda rakam varsa o metin reddedilir ve kural tabanlı metin kullanılır
/// (bkz. SmartInsightsService.IsClean). Anahtar yoksa veya hata olursa kural tabanlı servise düşer.
/// </summary>
public sealed class OpenAIFinanceNarrativeService : IFinanceNarrativeService
{
    private const string Model = "gpt-4o-mini";
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

    private readonly IFinanceNarrativeService _fallback;
    private readonly ILogger<OpenAIFinanceNarrativeService> _logger;
    private readonly string? _apiKey;

    public OpenAIFinanceNarrativeService(
        IConfiguration configuration,
        IFinanceNarrativeService fallback,
        ILogger<OpenAIFinanceNarrativeService> logger)
    {
        _fallback = fallback;
        _logger = logger;
        _apiKey = configuration["OpenAI:ApiKey"]?.Trim();
    }

    public async Task<FinanceNarrativeResult> GenerateAsync(FinanceNarrativeRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
            return await _fallback.GenerateAsync(request, cancellationToken);

        try
        {
            var client = new ChatClient(Model, _apiKey);
            const string system = """
                Sen RusWallet'in finans analisti asistanısın. Sana backend'in makine öğrenmesi ve istatistikle
                HESAPLADIĞI sonuçlar JSON olarak verilecek. Görevin bunları kullanıcıya kısa, net, yargılamayan Türkçe ile açıklamak.

                KESİN KURALLAR:
                - Çıktıda HİÇBİR rakam veya sayı yazma (ne tutar, ne yüzde, ne tarih). Rakamlar arayüzde ayrıca gösteriliyor.
                - Verilmeyen bir bilgiyi uydurma; sadece verilen kategori adları ve neden kodlarına dayan.
                - "title" eylem odaklı olsun (ör. "Restoran harcamasını tipik seviyene çek"); yalnızca kategori adı yazma.
                - "action" somut ve uygulanabilir olsun (ör. haftalık limit, paket değişikliği, iptal); "azaltın" gibi genel ifadelerden kaçın.
                - Kullanıcıya "sen" diye hitap et.
                - Yatırım tavsiyesi verme.
                - Sadece aşağıdaki JSON şemasıyla yanıt ver:
                {
                  "forecastCommentary": "1-2 cümle, en fazla 220 karakter (tahmin yoksa null)",
                  "savings": [ { "id": "girdideki id", "title": "en fazla 60 karakter",
                                 "explanation": "neden bu öneri, 1 cümle", "action": "somut tek adım, 1 cümle" } ]
                }

                Neden kodları: trend_up = son aylarda artış, above_typical = geçen ay tipik aydan yüksek,
                high_volatility = aylar arası dalgalı, large_share = esnek harcamada büyük pay,
                subscription_price_increase = abonelik fiyatı arttı, overlapping_subscriptions = aynı kategoride birden fazla abonelik.
                """;

            var payload = JsonSerializer.Serialize(request, JsonOpts);
            var options = new ChatCompletionOptions
            {
                ResponseFormat = ChatResponseFormat.CreateJsonObjectFormat(),
                Temperature = 0.4f,
                MaxOutputTokenCount = 900,
            };
            var completion = await client.CompleteChatAsync(
                new ChatMessage[] { new SystemChatMessage(system), new UserChatMessage(payload) },
                options,
                cancellationToken);

            var text = completion.Value.Content.Count > 0 ? completion.Value.Content[0].Text : null;
            if (string.IsNullOrWhiteSpace(text))
                return await _fallback.GenerateAsync(request, cancellationToken);

            var parsed = JsonSerializer.Deserialize<AiResponse>(text, JsonOpts);
            var result = new FinanceNarrativeResult { Source = "openai", ForecastCommentary = parsed?.ForecastCommentary?.Trim() };
            foreach (var s in parsed?.Savings ?? new())
            {
                if (string.IsNullOrWhiteSpace(s.Id)) continue;
                result.Savings[s.Id] = new SavingsNarrative
                {
                    Title = s.Title?.Trim() ?? "",
                    Explanation = s.Explanation?.Trim() ?? "",
                    Action = s.Action?.Trim() ?? "",
                };
            }
            return result;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "OpenAI finans açıklaması alınamadı; kural tabanlı metin kullanılacak.");
            return await _fallback.GenerateAsync(request, cancellationToken);
        }
    }

    private sealed class AiResponse
    {
        public string? ForecastCommentary { get; set; }
        public List<AiSaving>? Savings { get; set; }
    }

    private sealed class AiSaving
    {
        public string? Id { get; set; }
        public string? Title { get; set; }
        public string? Explanation { get; set; }
        public string? Action { get; set; }
    }
}
