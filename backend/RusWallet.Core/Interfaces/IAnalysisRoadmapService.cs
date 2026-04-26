using RusWallet.Core.DTOs.Finance;

namespace RusWallet.Core.Interfaces;

/// <summary>ML/istatistik ile Analizlerim sayfası için birleşik yol haritası.</summary>
public interface IAnalysisRoadmapService
{
    Task<FinancialRoadmapResponseDto> GetRoadmapAsync(int userId, CancellationToken cancellationToken = default);
}
