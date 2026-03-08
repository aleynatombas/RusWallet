namespace RusWallet.Core.DTOs.Transaction
{
    /// <summary>Manuel işlem ekleme: kategori adı + fiyat + gelir/gider kullanıcı girer.</summary>
    public class AddTransactionManualDto
    {
        public string CategoryName { get; set; } = null!;
        public decimal Amount { get; set; }
        public bool IsIncome { get; set; }
        /// <summary>İşlem açıklaması; boşsa kategori adı kullanılır.</summary>
        public string? Description { get; set; }
        /// <summary>İşlem tarihi; gönderilmezse bugün.</summary>
        public DateTime? TransactionDate { get; set; }
    }
}
