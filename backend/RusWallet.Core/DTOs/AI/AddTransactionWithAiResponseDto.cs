namespace RusWallet.Core.DTOs.AI
{
    /// <summary>AI ile eklenen işlemin özeti; analizlerde kullanılır.</summary>
    public class AddTransactionWithAiResponseDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = null!;
        public bool IsIncome { get; set; }
        public decimal Amount { get; set; }
        public DateTime TransactionDate { get; set; }
        public string Source { get; set; } = null!;
    }
}