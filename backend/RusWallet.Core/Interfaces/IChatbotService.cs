namespace RusWallet.Core.Interfaces
{
    public interface IChatbotService
    {
        Task<string> AskAsync(string message);
    }
}
