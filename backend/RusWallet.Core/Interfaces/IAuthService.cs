using RusWallet.Core.DTOs.Auth;

namespace RusWallet.Core.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto);
        Task<AuthResponseDto> LoginAsync(LoginRequestDto dto);
        Task ResetPasswordByEmailAsync(ResetPasswordByEmailRequestDto dto);
        Task<AuthResponseDto> UpdateProfileAsync(int userId, UpdateProfileRequestDto dto);
        Task ChangePasswordAsync(int userId, ChangePasswordRequestDto dto);
        Task DeleteAccountAsync(int userId);
    }
}
