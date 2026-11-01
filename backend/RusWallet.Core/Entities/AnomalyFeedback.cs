namespace RusWallet.Core.Entities
{
    /// <summary>
    /// Kullanıcının "bu normal" diye işaretlediği anomali. Anahtar örnekleri:
    /// "tx:123" (tek işlem), "cat-amount:5:2026-11" (kategori tutarı), "cat-freq:5:2026-11" (kategori sıklığı).
    /// İşaretlenen anomaliler tekrar gösterilmez.
    /// </summary>
    public class AnomalyFeedback
    {
        public int AnomalyFeedbackId { get; set; }
        public int UserId { get; set; }
        public string AnomalyKey { get; set; } = null!;
        public DateTime CreatedAtUtc { get; set; }
        public User User { get; set; } = null!;
    }
}
