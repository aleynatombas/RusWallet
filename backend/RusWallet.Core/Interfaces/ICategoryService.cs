using RusWallet.Core.DTOs.Category;
using RusWallet.Core.DTOs.Prediction;

namespace RusWallet.Core.Interfaces
{
    public interface ICategoryService
    {
        Task<List<CategoryResponseDto>> GetAllCategoriesAsync();
    }
}
