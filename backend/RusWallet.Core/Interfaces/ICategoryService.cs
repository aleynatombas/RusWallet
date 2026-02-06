using RusWallet.Core.DTOs.Category;

namespace RusWallet.Core.Interfaces
{
    public interface ICategoryService
    {
        Task<List<CategoryResponseDto>> GetAllCategoriesAsync();
    }
}
