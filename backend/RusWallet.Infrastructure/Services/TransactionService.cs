using RusWallet.Core.DTOs.Transaction;
using RusWallet.Core.Interfaces;
using RusWallet.Infrastructure.Data;
using RusWallet.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace RusWallet.Infrastructure.Services;
 public class TransactionService : ITransactionService
{
    private readonly AppDbContext _context;
    public TransactionService(AppDbContext context)
    {
    _context = context;
    }
    public async Task AddTransactionAsync(int userId, TransactionCreateDto dto)
    {
        var transaction = new Transaction
        {
            Amount = dto.Amount,
            Description = dto.Description,
            TransactionDate = dto.TransactionDate,
            IsIncome= dto.IsIncome,
            CategoryId = dto.CategoryId,
            UserId = userId,
        };
          
        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();
    }

    public async Task<List<TransactionResponseDto>> GetUserTransactionsAsync(int userId)
    {
        return await _context.Transactions
        .Where(x => x.UserId == userId)
        .Include(x => x.Category)
        .Select(x => new TransactionResponseDto
        {
            Amount = x.Amount,
            Description = x.Description,
            TransactionDate = x.TransactionDate,
            IsIncome = x.IsIncome,
            CategoryId = x.CategoryId,
            CategoryName = x.Category.Name
        })
        .ToListAsync();
    }


}  

