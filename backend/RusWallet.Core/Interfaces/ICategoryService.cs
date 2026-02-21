using RusWallet.Core.DTOs.Category;

namespace RusWallet.Core.Interfaces
{
    public interface ICategoryService
    {
       Task AddCategoryAsync(int userId, CategoryCreateDto dto);

    Task<List<CategoryResponseDto>> GetUserCategoriesAsync(int userId);

    Task DeleteCategoryAsync(int userId, int categoryId);
    }

}
