namespace RusWallet.Core.DTOs.Receipt;

/// <summary>POST /api/receipt/upload yanıtı: çıkarılan veri, atanan kategori ve işlem oluşturuldu bilgisi.</summary>
public class ReceiptUploadResponseDto
{
    /// <summary>Fişten çıkarılan alanlar (vendor, tarih, toplam).</summary>
    public ReceiptExtractionResultDto Extraction { get; set; } = null!;

    /// <summary>AI ile atanan kategori adı (örn. Market, Yemek).</summary>
    public string AssignedCategoryName { get; set; } = string.Empty;

    /// <summary>İşlemin kaydedildiği kategori id.</summary>
    public int AssignedCategoryId { get; set; }

    /// <summary>İşlem başarıyla oluşturulduysa true.</summary>
    public bool TransactionCreated { get; set; }
}
