using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using RusWallet.Core.Entities;

namespace RusWallet.Infrastructure.Security
{
    public class JwtService
    {
        private readonly IConfiguration _configuration;

        public JwtService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public int GetAccessTokenLifetimeSeconds()
        {
            var minutes = _configuration.GetValue("Jwt:AccessTokenMinutes", 120);
            if (minutes < 5) minutes = 5;
            if (minutes > 24 * 60) minutes = 24 * 60;
            return minutes * 60;
        }

        public int GetRefreshTokenLifetimeDays() =>
            Math.Clamp(_configuration.GetValue("Jwt:RefreshTokenDays", 14), 1, 90);

        public string GenerateToken(User user)
        {
            if (user == null)
                throw new ArgumentNullException(nameof(user));

            if (string.IsNullOrEmpty(user.Email))
                throw new ArgumentNullException(nameof(user.Email), "User email boş");

            var jwtKey = _configuration["Jwt:Key"];
            var jwtIssuer = _configuration["Jwt:Issuer"];
            var jwtAudience = _configuration["Jwt:Audience"];

            if (string.IsNullOrEmpty(jwtKey))
                throw new InvalidOperationException("JWT Key configuration boş");
            if (string.IsNullOrEmpty(jwtIssuer))
                throw new InvalidOperationException("JWT Issuer configuration boş");
            if (string.IsNullOrEmpty(jwtAudience))
                throw new InvalidOperationException("JWT Audience configuration boş");

            var claims = new[]
            {
                new Claim("id", user.UserId.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FirstName),
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.UtcNow.AddSeconds(GetAccessTokenLifetimeSeconds());

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: expires,
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public void AssignNewRefreshToken(User user, out string plainRefreshToken)
        {
            plainRefreshToken = RefreshTokenService.CreatePlainToken(user.UserId);
            user.RefreshTokenHash = RefreshTokenService.HashToken(plainRefreshToken);
            user.RefreshTokenExpiresUtc = DateTime.UtcNow.AddDays(GetRefreshTokenLifetimeDays());
        }

        public void ClearRefreshToken(User user)
        {
            user.RefreshTokenHash = null;
            user.RefreshTokenExpiresUtc = null;
        }
    }
}
