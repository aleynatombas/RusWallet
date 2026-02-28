using RusWallet.Core.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace RusWallet.Core.Interfaces
{
    public interface ICategoryRepository
    {
        Task AddAsync(Category category);
        Task<List<Category>> GetAllByUserAsync(int userId);
        Task<Category?> GetByIdAsync(int categoryId);
        Task UpdateAsync(Category category);
        Task DeleteAsync(int categoryId);
    }
}