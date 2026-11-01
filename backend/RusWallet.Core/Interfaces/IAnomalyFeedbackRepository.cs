namespace RusWallet.Core.Interfaces
{
    public interface IAnomalyFeedbackRepository
    {
        Task<HashSet<string>> GetKeysAsync(int userId);
        /// <summary>Anahtar zaten varsa bir şey yapmaz.</summary>
        Task AddAsync(int userId, string anomalyKey);
        Task RemoveAsync(int userId, string anomalyKey);
    }
}
