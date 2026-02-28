using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using RusWallet.Core.Interfaces;

namespace RusWallet.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PredictionController : ControllerBase
    {
        private readonly IPredictionService _predictionService;

        public PredictionController(IPredictionService predictionService)
        {
            _predictionService = predictionService;
        }

        /// <summary>Tahmin. userId JWT'den alınır; sadece month query'de gönderilir.</summary>
        [HttpGet("monthly")]
        public async Task<IActionResult> GetMonthlyPrediction([FromQuery] DateTime month)
        {
            var idClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
            int userId = int.Parse(idClaim);

            var result = await _predictionService.GetMonthlyPredictionAsync(userId, month);
            return Ok(result);
        }
    }
}