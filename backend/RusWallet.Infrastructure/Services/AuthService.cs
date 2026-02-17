using RusWallet.Core.Interfaces;
using RusWallet.Infrastructure.Data;
using RusWallet.Core.Entities;
using RusWallet.Core.DTOs.Auth;
using Microsoft.EntityFrameworkCore;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly JwtService _jwtService;

      public AuthService(AppDbContext context, JwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

     public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto)
    {

        
    var existingUser = await _context.Users
    .FirstOrDefaultAsync(x => x.Email == dto.Email);

    if (existingUser != null)
    throw new Exception("Bu e-posta adresi zaten kayıtlı");

        
        var user = new User
        {
            FirstName = dto.FirstName,
            LastName= dto.LastName,
            PhoneNumber= dto.PhoneNumber,
            Email = dto.Email,
            PasswordHash = dto.Password,
            CreatedAt = DateTime.UtcNow
        
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

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
         var user = await _context.Users
        .FirstOrDefaultAsync(x => x.Email == dto.Email);

    if (user == null)
        throw new Exception("Kullanıcı bulunamadı");

    if (user.PasswordHash != dto.Password)
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
