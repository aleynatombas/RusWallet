using Microsoft.EntityFrameworkCore;
using RusWallet.Core.Entities;
using RusWallet.Core.Interfaces;
using RusWallet.Infrastructure.Data;

namespace RusWallet.Infrastructure.Repositories;

public sealed class AnomalyFeedbackRepository : IAnomalyFeedbackRepository
{
    private readonly AppDbContext _context;

    public AnomalyFeedbackRepository(AppDbContext context) => _context = context;

    public async Task<HashSet<string>> GetKeysAsync(int userId) =>
        (await _context.AnomalyFeedbacks
            .Where(f => f.UserId == userId)
            .Select(f => f.AnomalyKey)
            .ToListAsync())
        .ToHashSet();

    public async Task AddAsync(int userId, string anomalyKey)
    {
        var exists = await _context.AnomalyFeedbacks.AnyAsync(f => f.UserId == userId && f.AnomalyKey == anomalyKey);
        if (exists) return;
        _context.AnomalyFeedbacks.Add(new AnomalyFeedback
        {
            UserId = userId,
            AnomalyKey = anomalyKey,
            CreatedAtUtc = DateTime.UtcNow,
        });
        await _context.SaveChangesAsync();
    }

    public Task RemoveAsync(int userId, string anomalyKey) =>
        _context.AnomalyFeedbacks
            .Where(f => f.UserId == userId && f.AnomalyKey == anomalyKey)
            .ExecuteDeleteAsync();
}
