using RusWallet.Core.DTOs.AI;
using RusWallet.Core.Interfaces;

namespace RusWallet.API.Services;

/// <summary>
/// Önce kullanıcı verisine dayalı kısa yanıtları dener; yoksa içteki FAQ/OpenAI akışına geçer.
/// </summary>
public class PersonalizedChatbotService : IChatbotService
{
    private readonly IPersonalizedChatAnswerService _personalized;
    private readonly IChatbotService _inner;

    public PersonalizedChatbotService(IPersonalizedChatAnswerService personalized, IChatbotService inner)
    {
        _personalized = personalized;
        _inner = inner;
    }

    public async Task<ChatResponseDto> AskAsync(int userId, string message)
    {
        var direct = await _personalized.TryAnswerAsync(userId, message);
        if (direct != null)
            return direct;
        return await _inner.AskAsync(userId, message);
    }
}
