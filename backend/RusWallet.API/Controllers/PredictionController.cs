using Microsoft.AspNetCore.Mvc;
using RusWallet.Core.Interfaces;

namespace RusWallet.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PredictionController : ControllerBase
    {
        private readonly IPredictionService _predictionService;

        public PredictionController(IPredictionService predictionService)
        {
            _predictionService = predictionService;
        }

        [HttpGet("monthly")]
        public async Task<IActionResult> GetMonthlyPrediction(int userId, DateTime month)
        {
            var result = await _predictionService.GetMonthlyPredictionAsync(userId, month);
            return Ok(result);
        }
    }
}