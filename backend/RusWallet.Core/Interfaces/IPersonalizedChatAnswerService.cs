using RusWallet.Core.DTOs.AI;

namespace RusWallet.Core.Interfaces;

/// <summary>
/// Kullanıcının işlem verilerine dayalı kısa yanıtlar (ör. bu ay harcama).
/// Eşleşme yoksa null döner; chatbot genel akışa devreder.
/// </summary>
public interface IPersonalizedChatAnswerService
{
    Task<ChatResponseDto?> TryAnswerAsync(int userId, string message);
}
