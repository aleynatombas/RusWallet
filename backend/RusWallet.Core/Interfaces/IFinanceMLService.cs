using RusWallet.Core.DTOs.Finance;

namespace RusWallet.Core.Interfaces
{
    /// <summary>ML/istatistik tabanlı bütçe önerisi ve anomali tespiti.</summary>
    public interface IFinanceMLService
    {
        /// <summary>Kategorilere göre bütçe hedefi önerir (geçmiş harcama ortalaması/trend).</summary>
        /// <param name="userId">Kullanıcı id.</param>
        /// <param name="lastMonths">Kaç ay geriye bakılacak (varsayılan 6).</param>
        Task<BudgetSuggestionsResponseDto> GetBudgetSuggestionsAsync(int userId, int lastMonths = 6);

        /// <summary>Bu ay veya verilen dönemde alışılmadık yüksek harcama (anomali) tespit eder.</summary>
        /// <param name="userId">Kullanıcı id.</param>
        /// <param name="forMonth">Kontrol edilecek ay (varsayılan bu ay).</param>
        /// <param name="historicalMonths">Karşılaştırma için kaç ay kullanılacak (varsayılan 6).</param>
        Task<AnomaliesResponseDto> GetAnomaliesAsync(int userId, DateTime? forMonth = null, int historicalMonths = 6);
    }
}
