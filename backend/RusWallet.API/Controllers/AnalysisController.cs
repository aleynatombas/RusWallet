using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using RusWallet.Core.Interfaces;

namespace RusWallet.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AnalysisController : ControllerBase
    {
        private readonly IFinanceAnalysisService _financeAnalysisService;

        public AnalysisController(IFinanceAnalysisService financeAnalysisService)
        {
            _financeAnalysisService = financeAnalysisService;
        }

        /// <summary>Giriş yapmış kullanıcının finansal özeti. userId JWT'den alınır.</summary>
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var idClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
            int userId = int.Parse(idClaim);

            var result = await _financeAnalysisService.GetSummaryAsync(userId);
            return Ok(result);
        }
    }
}