namespace RusWallet.Core.DTOs.Receipt;

/// <summary>POST /api/Receipt/confirm gövdesi: düzenlenmiş fiş verisi. Onaylanınca işlem oluşturulur.</summary>
public class ReceiptConfirmRequestDto
{
    /// <summary>Toplam tutar (TL).</summary>
    public decimal TotalAmount { get; set; }

    /// <summary>İşlem tarihi.</summary>
    public DateTime TransactionDate { get; set; }

    /// <summary>Açıklama (örn. "Fiş: Market XYZ"). Boşsa "Fiş" kullanılır.</summary>
    public string? Description { get; set; }

    /// <summary>Kategori id (kullanıcının seçtiği veya önerilen).</summary>
    public int CategoryId { get; set; }
}
