namespace RusWallet.Core.DTOs.Auth;

/// <summary>
/// Oturum açmadan e-posta + yeni şifre ile güncelleme (giriş öncesi yardım ekranı).
/// Üretim ortamında e-posta doğrulaması veya token şartı eklenmelidir.
/// </summary>
public class ResetPasswordByEmailRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
