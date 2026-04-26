namespace RusWallet.Core.DTOs.Onboarding
{
    public class UserFinancialProfilePayload
    {
        public decimal? MonthlyIncomeNet { get; set; }

        /// <summary>Eski tek satır tahmini sabit gider (TL/ay); yalnızca geriye dönük uyumluluk.</summary>
        public decimal? MonthlyFixedCostsApprox { get; set; }

        /// <summary>Tanıtımda ayrı sorulan sabit kalemler (TL/ay).</summary>
        public decimal? MonthlyRentApprox { get; set; }
        public decimal? MonthlyBillsApprox { get; set; }
        public decimal? MonthlySubscriptionsApprox { get; set; }

        public string? MainGoal { get; set; }

        /// <summary>Birikim gibi sayısal hedef (TL); analiz ve sohbet bağlamı için.</summary>
        public decimal? SavingsTargetAmount { get; set; }
    }
}
