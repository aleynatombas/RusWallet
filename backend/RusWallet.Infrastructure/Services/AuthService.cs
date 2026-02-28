using RusWallet.Core.Interfaces;
using RusWallet.Core.Entities;
using RusWallet.Core.DTOs.Auth;
using RusWallet.Infrastructure.Security;

namespace RusWallet.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly JwtService _jwtService;

        public AuthService(IUserRepository userRepository, JwtService jwtService)
        {
            _userRepository = userRepository;
            _jwtService = jwtService;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto)
        {
            var existingUser = await _userRepository.GetByEmailAsync(dto.Email);
            if (existingUser != null)
                throw new Exception("Bu e-posta adresi zaten kayıtlı");

            // Adım 2: Şifreyi hash'le — düz metin asla veritabanına yazılmaz
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            var user = new User
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                PhoneNumber = dto.PhoneNumber,
                Email = dto.Email,
                PasswordHash = hashedPassword,
                CreatedAt = DateTime.UtcNow
            };
            await _userRepository.AddAsync(user);

            return new AuthResponseDto
            {
                UserId = user.UserId,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto dto)
        {
            var user = await _userRepository.GetByEmailAsync(dto.Email);
            if (user == null)
                throw new Exception("Kullanıcı bulunamadı");

            // Adım 3: Gelen düz şifreyi, veritabanındaki hash ile doğrula
            if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                throw new Exception("Şifre yanlış");

            var token = _jwtService.GenerateToken(user);

            return new AuthResponseDto
            {
                UserId = user.UserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Token = token
            };
        }
    }
}
