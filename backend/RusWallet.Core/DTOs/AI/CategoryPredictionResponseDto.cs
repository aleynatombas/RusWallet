namespace RusWallet.Core.DTOs.AI
{
    public class CategoryPredictionResponseDto
    {
        public string PredictedCategoryName { get; set; } = null!;

        public bool IsIncome { get; set; }
    }
}
