namespace RusWallet.Core.DTOs.Finance
{
    /// <summary>Kategori bazlı bütçe önerisi (geçmiş harcamalara göre ML/istatistik).</summary>
    public class BudgetSuggestionDto
    {
        public string CategoryName { get; set; } = null!;
        public int CategoryId { get; set; }
        /// <summary>Önerilen aylık bütçe (geçmiş ortalamaya göre).</summary>
        public decimal SuggestedAmount { get; set; }
        /// <summary>Son N aydaki ortalama harcama.</summary>
        public decimal AverageSpent { get; set; }
        /// <summary>Toplam harcama içindeki yüzde (0-100).</summary>
        public double PercentageOfTotal { get; set; }
        /// <summary>Hesaplamada kullanılan ay sayısı.</summary>
        public int MonthsUsed { get; set; }
        /// <summary>Öneri ML.NET regresyon ile mi hesaplandı (false ise ortalama kullanıldı).</summary>
        public bool SuggestedByML { get; set; }
    }

    public class BudgetSuggestionsResponseDto
    {
        public List<BudgetSuggestionDto> Suggestions { get; set; } = new();
        public int MonthsAnalyzed { get; set; }
        /// <summary>Veri yoksa veya liste boşsa açıklama.</summary>
        public string? Message { get; set; }
    }
}
