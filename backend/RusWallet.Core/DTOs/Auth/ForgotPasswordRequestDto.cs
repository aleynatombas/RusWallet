namespace RusWallet.Core.DTOs.Auth;

/// <summary>POST /auth/forgot-password — e-posta gönder, şifre sıfırlama kodu iste.</summary>
public class ForgotPasswordRequestDto
{
    public string Email { get; set; } = string.Empty;
}
