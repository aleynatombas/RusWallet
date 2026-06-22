using RusWallet.Core.DTOs.Auth;

namespace RusWallet.Core.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto);
        Task<AuthResponseDto> LoginAsync(LoginRequestDto dto);
        /// <summary>6 haneli OTP kodu üretir, e-posta ile gönderir (15 dk geçerli).</summary>
        Task ForgotPasswordAsync(ForgotPasswordRequestDto dto);
        /// <summary>E-posta + kod + yeni şifre ile sıfırlama.</summary>
        Task ResetPasswordWithCodeAsync(ResetPasswordWithCodeRequestDto dto);
        Task ResetPasswordByEmailAsync(ResetPasswordByEmailRequestDto dto);
        Task<AuthResponseDto> UpdateProfileAsync(int userId, UpdateProfileRequestDto dto);
        Task ChangePasswordAsync(int userId, ChangePasswordRequestDto dto);
        Task DeleteAccountAsync(int userId);
    }
}

