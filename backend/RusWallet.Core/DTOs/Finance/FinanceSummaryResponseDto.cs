namespace RusWallet.Core.DTOs.Finance
{
    public class FinanceSummaryResponseDto
    {
        public decimal TotalIncome { get; set; }

        public decimal TotalExpense { get; set; }

        public decimal Balance { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }
    }
}
