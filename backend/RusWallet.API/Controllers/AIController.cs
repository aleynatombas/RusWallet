using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RusWallet.Core.DTOs.AI;
using RusWallet.Core.Interfaces;

namespace RusWallet.API.Controllers
{
    /// <summary>
    /// AI destekli özellikler: işlem açıklamasına göre kategori önerisi (ücretsiz kelime tabanlı).
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AIController : ControllerBase
    {
        private readonly IAIService _aiService;

        public AIController(IAIService aiService)
        {
            _aiService = aiService;
        }

        /// <summary>İşlem açıklamasına göre önerilen kategori ve gelir/gider bilgisi.</summary>
        [HttpPost("suggest-category")]
        public async Task<ActionResult<CategoryPredictionResponseDto>> SuggestCategory([FromBody] CategoryPredictionRequestDto dto)
        {
            var result = await _aiService.PredictCategoryAsync(dto.Description ?? "");
            return Ok(result);
        }
    }
}
