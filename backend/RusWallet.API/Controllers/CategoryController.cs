using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RusWallet.Core.Interfaces;

namespace RusWallet.API.Controllers
{
    /// <summary>Kategoriler işlem eklerken (manuel veya AI) otomatik oluşur. Burada sadece listeleme ve silme.</summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CategoryController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoryController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        /// <summary>Kullanıcının kategorileri (transaction eklerken otomatik oluşanlar).</summary>
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var idClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
            int userId = int.Parse(idClaim);

            var result = await _categoryService.GetUserCategoriesAsync(userId);
            return Ok(result);
        }

        /// <summary>Kategori siler (işlemlerde kullanılıyorsa dikkat).</summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var idClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
            int userId = int.Parse(idClaim);

            await _categoryService.DeleteCategoryAsync(userId, id);
            return Ok();
        }
    }
}