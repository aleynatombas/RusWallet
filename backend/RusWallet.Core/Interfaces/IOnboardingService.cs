using RusWallet.Core.DTOs.Onboarding;

namespace RusWallet.Core.Interfaces
{
    public interface IOnboardingService
    {
        Task<OnboardingStateDto> GetStateAsync(int userId);
        Task<OnboardingAnswerResponseDto> PostAnswerAsync(int userId, string message);
        Task SkipAsync(int userId);
        /// <summary>Profil tamamlanmış olsa bile sohbeti yeniden açar (adım 0, mevcut JSON korunur).</summary>
        Task ReopenAsync(int userId);
        /// <summary>Güncelleme sohbetini iptal eder; profili tamamlandı sayar (mevcut JSON korunur).</summary>
        Task AbortReopenAsync(int userId);

        /// <summary>Finans profili JSON alanlarını birleştirir; tamamlanmış profilde baseline işlem mantığı korunur.</summary>
        Task<OnboardingStateDto> PatchProfileAsync(int userId, OnboardingProfilePatchDto patch);

        /// <summary>
        /// Tanışma profilindeki net gelir / sabit gider tahminlerini bu ay için idempotent işlem satırlarına yazar (yoksa).
        /// İşlem listesi ve özet isteklerinde tetiklenir; GET state dışında da veri tutarlı kalsın.
        /// </summary>
        Task SyncProfileBaselinesAsync(int userId);
    }
}
