namespace RusWallet.Core.DTOs.Receipt;

/// <summary>POST /api/Receipt/extract yanıtı: OCR çıktısı (düzenlenebilir) ve önerilen kategori. İşlem oluşturulmaz.</summary>
public class ReceiptExtractResponseDto
{
    /// <summary>Fişten çıkarılan alanlar (vendor, tarih, toplam, ham metin). Kullanıcı düzenleyip onaylayınca /confirm ile işlem eklenir.</summary>
    public ReceiptExtractionResultDto Extraction { get; set; } = null!;

    /// <summary>AI ile önerilen kategori adı (örn. Market, Yemek).</summary>
    public string SuggestedCategoryName { get; set; } = string.Empty;

    /// <summary>Önerilen kategorinin id'si (yoksa oluşturulur). Onay ekranında kullanıcı değiştirebilir.</summary>
    public int SuggestedCategoryId { get; set; }

    /// <summary>AI + OCR birleşimi: işlemin gelir olarak kaydedilmesi önerilir.</summary>
    public bool SuggestedIsIncome { get; set; }

    /// <summary>"receipt" | "voice" — onay ekranı başlığı / ham metin gösterimi için.</summary>
    public string? Source { get; set; }
}
