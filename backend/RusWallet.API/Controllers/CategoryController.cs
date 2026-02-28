using Microsoft.AspNetCore.Mvc;
using RusWallet.Core.Interfaces;
using RusWallet.Infrastructure.Services;
using RusWallet.Core.DTOs.Category;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;


[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoryController : ControllerBase
{

    private readonly ICategoryService _categoryService;

    public CategoryController (ICategoryService categoryService)
    {
         _categoryService = categoryService;
    }
 
    [HttpPost("add")]
    public async Task<IActionResult> Add( CategoryCreateDto dto)
    {
        var idClaim = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
        int userId = int.Parse(idClaim);

        await _categoryService.AddCategoryAsync(userId, dto);
        return Ok();
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var idClaim = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
        int userId = int.Parse(idClaim);

        var result = await _categoryService.GetUserCategoriesAsync(userId);
        return Ok(result);
    }

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