using System.Text.Json.Serialization;

namespace RusWallet.Core.DTOs.Receipt;

/// <summary>Fiş görselinden OCR/AI ile çıkarılan alanlar.</summary>
public class ReceiptExtractionResultDto
{
    /// <summary>Satıcı / işletme adı.</summary>
    public string VendorName { get; set; } = string.Empty;

    /// <summary>İşlem tarihi.</summary>
    public DateTime? TransactionDate { get; set; }

    /// <summary>Toplam tutar.</summary>
    public decimal TotalAmount { get; set; }

    /// <summary>OCR ham metni; yanıtta gönderilmez, sadece kategori tahmini için kullanılır.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? RawText { get; set; }
}
