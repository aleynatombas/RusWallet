namespace RusWallet.Core.Entities
{
    public class Transaction
    {
        public int TransactionId {get; set;}
        public decimal Amount { get; set; }
        public string Description { get; set; }
        public DateTime TransactionDate { get; set; }
        public bool IsIncome { get; set; }

        public int UserId { get; set; }// User who owns this transaction
        public int CategoryId { get; set; }// Category of the transaction
        public User User {get;set;}
        public Category Category {get; set;}
    }
}