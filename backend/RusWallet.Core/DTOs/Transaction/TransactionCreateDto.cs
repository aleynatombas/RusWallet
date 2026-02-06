namespace RusWallet.Core.DTOs.Transaction
{
    public class TransactionCreateDto
    {
        public decimal Amount { get; set; }

        public string Description { get; set; }

        public DateTime TransactionDate { get; set; }

        public bool IsIncome { get; set; }

        public int CategoryId { get; set; }
    }
}
