using RusWallet.Core.DTOs.AI;

namespace RusWallet.Core.Interfaces
{
    public interface IAIService
    {
        Task<CategoryPredictionResponseDto> PredictCategoryAsync(string description);
    }
}
