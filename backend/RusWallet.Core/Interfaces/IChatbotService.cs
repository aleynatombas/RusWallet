using RusWallet.Core.DTOs.AI;

namespace RusWallet.Core.Interfaces
{
    public interface IChatbotService
    {
        /// <param name="userId">JWT ile giriş yapmış kullanıcı; kişiselleştirme ve bağlam için kullanılır.</param>
        Task<ChatResponseDto> AskAsync(int userId, string message);
    }
}
