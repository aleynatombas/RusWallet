namespace RusWallet.Core.Interfaces;

/// <summary>
/// Chatbot (özellikle LLM) için kullanıcı finans özet metni üretir.
/// </summary>
public interface IChatUserFinancialContext
{
    Task<string> BuildSummaryAsync(int userId);
}
