namespace RusWallet.Core.DTOs.AI
{
    public class CategoryPredictionResponseDto
    {
        public string PredictedCategoryName { get; set; } = null!;
        public bool IsIncome { get; set; }
        /// <summary>Öneriyi işlem eklerken kullanmak için kategori id (yoksa oluşturuldu).</summary>
        public int CategoryId { get; set; }
        /// <summary>Önerinin kaynağı: "OpenAI" veya "Keyword" (hazır kelime tabanlı).</summary>
        public string Source { get; set; } = null!;
    }
}
