using RusWallet.Core.DTOs.Category;
using RusWallet.Core.DTOs.Prediction;

namespace RusWallet.Core.Interfaces
{
    public interface ICategoryService
{
    Task<List<CategoryResponseDto>> GetUserCategoriesAsync(int userId);

    Task AddCategoryAsync(int userId, CategoryCreateDto dto);

    Task DeleteCategoryAsync(int userId, int categoryId);
}

}
