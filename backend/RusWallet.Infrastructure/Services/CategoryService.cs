using RusWallet.Core.Interfaces;
using RusWallet.Core.Entities;
using RusWallet.Core.DTOs.Category;

namespace RusWallet.Infrastructure.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _categoryRepository;

        public CategoryService(ICategoryRepository categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        public async Task<List<CategoryResponseDto>> GetUserCategoriesAsync(int userId)
        {
            var categories = await _categoryRepository.GetAllByUserAsync(userId);
            return categories.Select(x => new CategoryResponseDto
            {
                IsIncome = x.IsIncome,
                CategoryId = x.CategoryId,
                Name = x.Name,
            }).ToList();
        }

        public async Task AddCategoryAsync(int userId, CategoryCreateDto dto)
        {
            var category = new Category
            {
                Name = dto.Name,
                IsIncome = dto.IsIncome,
                UserId = userId
            };
            await _categoryRepository.AddAsync(category);
        }

        public async Task DeleteCategoryAsync(int userId, int categoryId)
        {
            var category = await _categoryRepository.GetByIdAsync(categoryId);
            if (category == null || category.UserId != userId)
                return;

            await _categoryRepository.DeleteAsync(categoryId);
        }
    }
}