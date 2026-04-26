using RusWallet.Core.Entities;
using RusWallet.Core.Interfaces;
using RusWallet.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace RusWallet.Infrastructure.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;

        public UserRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetByIdAsync(int userId)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User?> GetByEmailCaseInsensitiveAsync(string email)
        {
            var e = email.Trim().ToLower();
            return await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == e);
        }

        public async Task AddAsync(User user)
        {
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int userId)
        {
            // Bazı ortamlarda FK'lar cascade olmayabilir (örn: Categories -> Users).
            // Bu yüzden kullanıcıyı silmeden önce bağlı kayıtları temizliyoruz.
            await using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                // Çocuk tabloları önce
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM [Transactions] WHERE [UserId] = {0}", userId);
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM [FinanceSummaries] WHERE [UserId] = {0}", userId);
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM [Predictions] WHERE [UserId] = {0}", userId);
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM [Categories] WHERE [UserId] = {0}", userId);

                // En son kullanıcı
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM [Users] WHERE [UserId] = {0}", userId);

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }
    }
}
