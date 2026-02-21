using Microsoft.AspNetCore.Mvc;
using RusWallet.Core.Interfaces;

namespace RusWallet.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalysisController : ControllerBase
    {
        private readonly IFinanceAnalysisService _financeAnalysisService;

        public AnalysisController(IFinanceAnalysisService financeAnalysisService)
        {
            _financeAnalysisService = financeAnalysisService;
        }

        [HttpGet("summary/{userId}")]
        public async Task<IActionResult> GetSummary(int userId)
        {
            var result = await _financeAnalysisService.GetSummaryAsync(userId);
            return Ok(result);
        }
    }
}