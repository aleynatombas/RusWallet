namespace RusWallet.Core.DTOs.AI
{
    /// <summary>AI ile işlem kaydı: sadece açıklama + fiyat; kategori ve gelir/gider otomatik, tarih bugün.</summary>
    public class AddTransactionWithAiRequestDto
    {
        public string Description { get; set; } = null!;
        public decimal Amount { get; set; }
    }
}
