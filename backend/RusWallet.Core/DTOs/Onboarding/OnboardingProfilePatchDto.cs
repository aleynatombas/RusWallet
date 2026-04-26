namespace RusWallet.Core.DTOs.Onboarding;

/// <summary>Analiz / ayarlar: hedef metni veya birikim tutarını kısmen günceller.</summary>
public class OnboardingProfilePatchDto
{
    public string? MainGoal { get; set; }

    /// <summary>Birikim hedefi (TL). 0 veya negatif gönderilirse alan temizlenir.</summary>
    public decimal? SavingsTargetAmount { get; set; }
}
