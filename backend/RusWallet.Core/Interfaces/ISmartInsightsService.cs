using RusWallet.Core.DTOs.Finance;

namespace RusWallet.Core.Interfaces
{
    /// <summary>Analizlerim sol sütunu: ML tahmini, anomali tespiti ve tasarruf fırsatları.</summary>
    public interface ISmartInsightsService
    {
        Task<SmartInsightsResponseDto> GetInsightsAsync(int userId, CancellationToken cancellationToken = default);

        /// <summary>Anomaliyi "normal" olarak işaretler. Anahtar kullanıcıya ait değilse false döner.</summary>
        Task<bool> MarkAnomalyAsNormalAsync(int userId, string anomalyKey);

        Task UnmarkAnomalyAsync(int userId, string anomalyKey);
    }
}
