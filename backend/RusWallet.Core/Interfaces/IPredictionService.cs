using RusWallet.Core.DTOs.Prediction;

namespace RusWallet.Core.Interfaces
{
    public interface IPredictionService
    {
        Task<PredictionResponseDto> GetMonthlyPredictionAsync(int userId, DateTime month);
    }
}
