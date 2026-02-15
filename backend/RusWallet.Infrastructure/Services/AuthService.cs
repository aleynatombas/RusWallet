using RusWallet.Core.Interfaces;
using RusWallet.Infrastructure.Data;
using RusWallet.Core.Entities;
using RusWallet.Core.DTOs.Auth;
using Microsoft.EntityFrameworkCore;

public class AuthService : IAuthService
{
     private readonly AppDbContext _context;
      public AuthService(AppDbContext context)
    {
        _context = context;
    }

     public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto)
    {

        
    var existingUser = await _context.Users
    .FirstOrDefaultAsync(x => x.Email == dto.Email);

    if (existingUser != null)
    throw new Exception("Email already exists");

        
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
            return null;

        if (user.PasswordHash != dto.Password)
            return null;

        return new AuthResponseDto
        {
            UserId = user.UserId,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email
        };
    }
}
