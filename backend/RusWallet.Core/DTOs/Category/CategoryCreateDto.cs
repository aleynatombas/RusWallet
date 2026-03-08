namespace RusWallet.Core.DTOs.Category
{
    /// <summary>Kategori eklerken sadece Name ve IsIncome gönderilir; userId JWT'den alınır.</summary>
    public class CategoryCreateDto
    {
        public string Name { get; set; } = null!;
        public bool IsIncome { get; set; }
    }
}
