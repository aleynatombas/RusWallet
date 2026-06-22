namespace RusWallet.Core.DTOs.Auth;

/// <summary>POST /auth/reset-password — e-posta + gelen 6 haneli kod + yeni şifre.</summary>
public class ResetPasswordWithCodeRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
