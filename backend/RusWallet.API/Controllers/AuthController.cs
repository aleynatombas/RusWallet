using Microsoft.AspNetCore.Mvc;
using RusWallet.Core.Interfaces;
using RusWallet.Core.DTOs.Auth;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register(RegisterRequestDto dto)
    {
        try
        {
            var result = await _authService.RegisterAsync(dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            // Known validation/business errors (e.g. duplicate email) should not be 500.
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(LoginRequestDto dto)
    {
        try
        {
            var result = await _authService.LoginAsync(dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    /// <summary>Oturum açmadan e-posta + yeni şifre (giriş öncesi yardım ekranı).</summary>
    [HttpPost("reset-password-by-email")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPasswordByEmail([FromBody] ResetPasswordByEmailRequestDto dto)
    {
        if (dto == null)
            return BadRequest(new { message = "İstek gövdesi gerekli." });
        try
        {
            await _authService.ResetPasswordByEmailAsync(dto);
            return Ok(new { message = "Şifreniz güncellendi. Giriş yapabilirsiniz." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ── Şifremi Unuttum — 2 adımlı OTP akışı ───────────────────────────────

    /// <summary>E-postaya 6 haneli doğrulama kodu gönderir (15 dk geçerli).</summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto dto)
    {
        if (dto == null)
            return BadRequest(new { message = "İstek gövdesi gerekli." });
        try
        {
            await _authService.ForgotPasswordAsync(dto);
            // Her durumda aynı mesaj — e-posta numaralandırma saldırısını önler
            return Ok(new { message = "Kayıtlı e-posta adresinize doğrulama kodu gönderildi." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>E-posta + OTP kodu + yeni şifre ile sıfırlama.</summary>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordWithCodeRequestDto dto)
    {
        if (dto == null)
            return BadRequest(new { message = "İstek gövdesi gerekli." });
        try
        {
            await _authService.ResetPasswordWithCodeAsync(dto);
            return Ok(new { message = "Şifreniz güncellendi. Giriş yapabilirsiniz." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Giriş yapan kullanıcının ad, soyad ve e-postasını günceller; yeni JWT döner.</summary>
    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequestDto dto)
    {
        var idClaim = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
        var userId = int.Parse(idClaim);
        try
        {
            var result = await _authService.UpdateProfileAsync(userId, dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Mevcut şifre doğrulamasıyla şifre değiştirir.</summary>
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto dto)
    {
        var idClaim = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
        var userId = int.Parse(idClaim);
        try
        {
            await _authService.ChangePasswordAsync(userId, dto);
            return Ok(new { message = "Şifreniz güncellendi." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Oturum açmış kullanıcının hesabını kalıcı olarak siler.</summary>
    [HttpDelete("me")]
    [Authorize]
    public async Task<IActionResult> DeleteMe()
    {
        var idClaim = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
        var userId = int.Parse(idClaim);
        try
        {
            await _authService.DeleteAccountAsync(userId);
            return Ok(new { message = "Hesabınız silindi." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
