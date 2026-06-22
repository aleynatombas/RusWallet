using RusWallet.Core.Interfaces;
using RusWallet.Core.Entities;
using RusWallet.Core.DTOs.Auth;
using RusWallet.Core.Validation;
using RusWallet.Infrastructure.Security;
using System.Security.Cryptography;
using System.Text;

namespace RusWallet.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly JwtService _jwtService;
        private readonly IOnboardingService _onboardingService;
        private readonly IEmailSender _emailSender;

        public AuthService(
            IUserRepository userRepository,
            JwtService jwtService,
            IOnboardingService onboardingService,
            IEmailSender emailSender)
        {
            _userRepository = userRepository;
            _jwtService = jwtService;
            _onboardingService = onboardingService;
            _emailSender = emailSender;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto)
        {
            var email = (dto.Email ?? "").Trim();
            if (!AuthInputValidation.IsValidEmailFormat(email))
                throw new Exception("Geçerli bir e-posta adresi girin (örn. ad@alan.com).");

            if (!AuthInputValidation.TryNormalizePhoneE164(dto.PhoneNumber, out var phoneE164, out var phoneError))
                throw new Exception(phoneError);

            if (!AuthInputValidation.TryValidatePassword(dto.Password, out var pwdError))
                throw new Exception(pwdError);

            var existingUser = await _userRepository.GetByEmailCaseInsensitiveAsync(email);
            if (existingUser != null)
                throw new Exception("Bu e-posta adresi zaten kayıtlı. Giriş yapın veya başka bir e-posta kullanın.");

            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password, workFactor: 10);

            var user = new User
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                PhoneNumber = phoneE164,
                Email = email,
                PasswordHash = hashedPassword,
                CreatedAt = DateTime.UtcNow
            };
            await _userRepository.AddAsync(user);
            var token = _jwtService.GenerateToken(user);

            return new AuthResponseDto
            {
                UserId = user.UserId,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Token = token,
                OnboardingCompleted = user.OnboardingCompletedAt != null,
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto dto)
        {
            var email = (dto.Email ?? "").Trim();
            if (!AuthInputValidation.IsValidEmailFormat(email))
                throw new Exception("Geçerli bir e-posta adresi girin (örn. ad@alan.com).");

            var user = await _userRepository.GetByEmailCaseInsensitiveAsync(email);
            if (user == null)
                throw new Exception("Kullanıcı bulunamadı");

            if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                throw new Exception("Şifreniz yanlış, tekrar deneyin.");

            if (user.OnboardingCompletedAt != null)
                _ = Task.Run(() => _onboardingService.SyncProfileBaselinesAsync(user.UserId));

            var token = _jwtService.GenerateToken(user);

            return new AuthResponseDto
            {
                UserId = user.UserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Token = token,
                OnboardingCompleted = user.OnboardingCompletedAt != null,
            };
        }

        public async Task ResetPasswordByEmailAsync(ResetPasswordByEmailRequestDto dto)
        {
            var email = (dto.Email ?? "").Trim();
            if (!AuthInputValidation.IsValidEmailFormat(email))
                throw new Exception("Geçerli bir e-posta adresi girin (örn. ad@alan.com).");
            if (!AuthInputValidation.TryValidatePassword(dto.NewPassword, out var pwdError))
                throw new Exception(pwdError);

            var user = await _userRepository.GetByEmailCaseInsensitiveAsync(email);
            if (user == null)
                throw new Exception("Bu e-posta ile kayıtlı hesap bulunamadı.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword, workFactor: 10);
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpires = null;
            await _userRepository.UpdateAsync(user);
        }

        // ── Şifremi Unuttum — 2 adımlı OTP akışı ───────────────────────────────

        public async Task ForgotPasswordAsync(ForgotPasswordRequestDto dto)
        {
            var email = (dto.Email ?? "").Trim();
            if (!AuthInputValidation.IsValidEmailFormat(email))
                throw new Exception("Geçerli bir e-posta adresi girin (örn. ad@alan.com).");

            var user = await _userRepository.GetByEmailCaseInsensitiveAsync(email);
            // Kullanıcı bulunamasa da hata döndürme — e-posta numaralandırma saldırısını önler
            if (user == null) return;

            // 6 haneli OTP üret
            var code = Random.Shared.Next(100_000, 1_000_000).ToString();
            // DB'de hash'ini sakla (düz kodu değil)
            var codeHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(code)));

            user.PasswordResetToken = codeHash;
            user.PasswordResetTokenExpires = DateTime.UtcNow.AddMinutes(15);
            await _userRepository.UpdateAsync(user);

            var html = $"""
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
                  <h2 style="color:#0d1321">RusWallet — Şifre Sıfırlama</h2>
                  <p>Şifrenizi sıfırlamak için aşağıdaki kodu kullanın:</p>
                  <div style="font-size:32px;font-weight:bold;letter-spacing:8px;
                              color:#1a7a9e;padding:16px 0">{code}</div>
                  <p style="color:#666">Bu kod <strong>15 dakika</strong> geçerlidir.</p>
                  <p style="color:#999;font-size:12px">
                    Bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.
                  </p>
                </div>
                """;

            await _emailSender.SendAsync(
                to: email,
                subject: "RusWallet — Şifre Sıfırlama Kodunuz",
                htmlBody: html);
        }

        public async Task ResetPasswordWithCodeAsync(ResetPasswordWithCodeRequestDto dto)
        {
            var email = (dto.Email ?? "").Trim();
            var code = (dto.Code ?? "").Trim();

            if (!AuthInputValidation.IsValidEmailFormat(email))
                throw new Exception("Geçerli bir e-posta adresi girin.");
            if (string.IsNullOrWhiteSpace(code))
                throw new Exception("Doğrulama kodu gerekli.");
            if (!AuthInputValidation.TryValidatePassword(dto.NewPassword, out var pwdError))
                throw new Exception(pwdError);

            var user = await _userRepository.GetByEmailCaseInsensitiveAsync(email);
            if (user == null)
                throw new Exception("Geçersiz veya süresi dolmuş kod.");

            // Token ve süre kontrolü
            if (string.IsNullOrEmpty(user.PasswordResetToken) ||
                user.PasswordResetTokenExpires == null ||
                user.PasswordResetTokenExpires < DateTime.UtcNow)
                throw new Exception("Kodun süresi dolmuş. Lütfen yeni kod isteyin.");

            var codeHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(code)));
            if (!string.Equals(codeHash, user.PasswordResetToken, StringComparison.OrdinalIgnoreCase))
                throw new Exception("Kod hatalı. Lütfen tekrar kontrol edin.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword, workFactor: 10);
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpires = null;
            await _userRepository.UpdateAsync(user);
        }

        public async Task<AuthResponseDto> UpdateProfileAsync(int userId, UpdateProfileRequestDto dto)
        {
            var user = await _userRepository.GetByIdAsync(userId)
                ?? throw new Exception("Kullanıcı bulunamadı.");

            var first = (dto.FirstName ?? "").Trim();
            var last = (dto.LastName ?? "").Trim();
            var email = (dto.Email ?? "").Trim();

            if (string.IsNullOrWhiteSpace(first))
                throw new Exception("Ad gerekli.");
            if (string.IsNullOrWhiteSpace(last))
                throw new Exception("Soyad gerekli.");
            if (!AuthInputValidation.IsValidEmailFormat(email))
                throw new Exception("Geçerli bir e-posta adresi girin (örn. ad@alan.com).");

            var other = await _userRepository.GetByEmailCaseInsensitiveAsync(email);
            if (other != null && other.UserId != userId)
                throw new Exception("Bu e-posta adresi başka bir hesaba kayıtlı.");

            user.FirstName = first;
            user.LastName = last;
            user.Email = email;
            await _userRepository.UpdateAsync(user);
            var token = _jwtService.GenerateToken(user);

            return new AuthResponseDto
            {
                UserId = user.UserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Token = token,
                OnboardingCompleted = user.OnboardingCompletedAt != null,
            };
        }

        public async Task ChangePasswordAsync(int userId, ChangePasswordRequestDto dto)
        {
            var user = await _userRepository.GetByIdAsync(userId)
                ?? throw new Exception("Kullanıcı bulunamadı.");

            if (string.IsNullOrWhiteSpace(dto.CurrentPassword))
                throw new Exception("Mevcut şifre gerekli.");
            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                throw new Exception("Mevcut şifre hatalı.");
            if (!AuthInputValidation.TryValidatePassword(dto.NewPassword, out var pwdError))
                throw new Exception(pwdError);

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword, workFactor: 10);
            await _userRepository.UpdateAsync(user);
        }

        public async Task DeleteAccountAsync(int userId)
        {
            var user = await _userRepository.GetByIdAsync(userId)
                ?? throw new Exception("Kullanıcı bulunamadı.");

            // Cascade ilişkiler DB tarafında silinir (Transactions/Categories/Predictions vb.)
            await _userRepository.DeleteAsync(user.UserId);
        }
    }
}
