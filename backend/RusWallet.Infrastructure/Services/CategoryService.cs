using RusWallet.Core.Interfaces;
using RusWallet.Infrastructure.Data;
using RusWallet.Core.Entities;
using Microsoft.EntityFrameworkCore;
using RusWallet.Core.DTOs.Category;


namespace RusWallet.Infrastructure.Services{
public class CategoryService : ICategoryService
{
     private readonly AppDbContext _context;
    public CategoryService(AppDbContext context)
    {
    _context = context;
    }

    public async Task<List<CategoryResponseDto>> GetUserCategoriesAsync(int userId)
    {
       return await _context.Categories
       .Where(x => x.UserId == userId)
       .Select(x => new CategoryResponseDto
       {
            IsIncome = x.IsIncome,
            CategoryId = x.CategoryId,
            Name = x.Name,
       })
       .ToListAsync();
    }

    public async Task AddCategoryAsync(int userId, CategoryCreateDto dto)
    {
        
        var category = new Category
        {
            Name = dto.Name,
            IsIncome=dto.IsIncome,
            UserId = userId
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteCategoryAsync(int userId, int categoryId)
    {
        var category = await _context.Categories
        .FirstOrDefaultAsync(x => x.CategoryId == categoryId 
        && x.UserId == userId);

    if (category == null)
        return; // veya throw new Exception("Category not found");

    _context.Categories.Remove(category);
    await _context.SaveChangesAsync();
    }

}
}