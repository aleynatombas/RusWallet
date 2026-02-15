namespace RusWallet.Core.DTOs.Transaction
{
    public class TransactionResponseDto
    {
        public int TransactionId { get; set; }

        public decimal Amount { get; set; }

        public string Description { get; set; }

        public DateTime TransactionDate { get; set; }

        public bool IsIncome { get; set; }

        public int CategoryId { get; set; }

        public string CategoryName { get; set; }

    }
}
