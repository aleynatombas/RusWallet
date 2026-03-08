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
        private readonly IFinanceMLService _financeMLService;

        public AnalysisController(IFinanceAnalysisService financeAnalysisService, IFinanceMLService financeMLService)
        {
            _financeAnalysisService = financeAnalysisService;
            _financeMLService = financeMLService;
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

        /// <summary>Kategorilere göre bütçe hedefi önerisi (geçmiş harcamalara göre ML/istatistik).</summary>
        /// <param name="lastMonths">Kaç ay geriye bakılsın (varsayılan 6).</param>
        [HttpGet("budget-suggestions")]
        public async Task<IActionResult> GetBudgetSuggestions([FromQuery] int lastMonths = 6)
        {
            var idClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
            int userId = int.Parse(idClaim);
            if (lastMonths < 1 || lastMonths > 24) lastMonths = 6;

            var result = await _financeMLService.GetBudgetSuggestionsAsync(userId, lastMonths);
            return Ok(result);
        }

        /// <summary>Bu ay veya verilen ay için anomali uyarıları (alışılmadık yüksek harcama).</summary>
        /// <param name="month">Kontrol edilecek ay (opsiyonel; varsayılan bu ay).</param>
        /// <param name="historicalMonths">Karşılaştırma için kaç ay kullanılsın (varsayılan 6).</param>
        [HttpGet("anomalies")]
        public async Task<IActionResult> GetAnomalies([FromQuery] DateTime? month = null, [FromQuery] int historicalMonths = 6)
        {
            var idClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
            int userId = int.Parse(idClaim);
            if (historicalMonths < 2 || historicalMonths > 24) historicalMonths = 6;

            var result = await _financeMLService.GetAnomaliesAsync(userId, month, historicalMonths);
            return Ok(result);
        }
    }
}