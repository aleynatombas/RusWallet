using RusWallet.Core.DTOs.AI;

namespace RusWallet.Core.Interfaces
{
    public interface IChatbotService
    {
        Task<ChatResponseDto> AskAsync(string message);
    }
}
