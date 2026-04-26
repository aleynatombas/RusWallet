
namespace RusWallet.Core.Entities
{
    public class User
    {
        public int UserId {get; set;}

        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PhoneNumber { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;

        public DateTime CreatedAt { get; set; } //User register date

        /// <summary>SHA-256 (hex) ile saklanan sıfırlama belirteci; düz metin e-postada gider.</summary>
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpires { get; set; }

        /// <summary>Sohbet tabanlı finans profili onboarding adımı (0–5). Tamamlanınca anlamsız olabilir.</summary>
        public int OnboardingStepIndex { get; set; }

        /// <summary>Dolu ise onboarding tamamlandı (veya atlandı).</summary>
        public DateTime? OnboardingCompletedAt { get; set; }

        /// <summary>Finans profili (UserFinancialProfilePayload) JSON.</summary>
        public string? FinancialProfileJson { get; set; }

        /// <summary>Tanıtımdan gelen tahmini aylık net gelir (TL); JSON ile birlikte güncellenir, raporlama ve doğrudan SQL sorguları için.</summary>
        public decimal? MonthlyIncomeNet { get; set; }

        /// <summary>Tanıtımdan gelen tahmini sabit gider (TL/ay); JSON ile birlikte güncellenir.</summary>
        public decimal? MonthlyFixedCostsApprox { get; set; }
    }
}