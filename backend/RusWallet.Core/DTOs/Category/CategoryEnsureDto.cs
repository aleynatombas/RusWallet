namespace RusWallet.Core.DTOs.Category;

/// <summary>Hızlı işlem: isim + tür ile kategori bul veya oluştur.</summary>
public class CategoryEnsureDto
{
    public string Name { get; set; } = "";

    public bool IsIncome { get; set; }
}
