using RusWallet.Core.Interfaces;
using RusWallet.Core.Entities;
using RusWallet.Core.DTOs.Auth;
using RusWallet.Core.Validation;
using RusWallet.Infrastructure.Security;

namespace RusWallet.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly JwtService _jwtService;
        private readonly IOnboardingService _onboardingService;

        public AuthService(
            IUserRepository userRepository,
            JwtService jwtService,
            IOnboardingService onboardingService)
        {
            _userRepository = userRepository;
            _jwtService = jwtService;
            _onboardingService = onboardingService;
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

            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password);

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
                await _onboardingService.SyncProfileBaselinesAsync(user.UserId);

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

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
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

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
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
