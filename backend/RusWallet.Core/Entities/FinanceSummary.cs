namespace RusWallet.Core.Entities
{
    public class FinanceSummary
    {
        public int FinanceSummaryId {get; set;} 
        public int UserId { get; set; } //UserId shows the owner of the finance summary.

        public decimal TotalIncome { get; set; }
        public decimal TotalExpense { get; set; }
        public decimal Balance { get; set; }// Income - expense
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public User User {get; set;}


    }
}