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
        private readonly IAnalysisRoadmapService _roadmapService;
        private readonly ISmartInsightsService _smartInsights;

        public AnalysisController(
            IFinanceAnalysisService financeAnalysisService,
            IFinanceMLService financeMLService,
            IAnalysisRoadmapService roadmapService,
            ISmartInsightsService smartInsights)
        {
            _financeAnalysisService = financeAnalysisService;
            _financeMLService = financeMLService;
            _roadmapService = roadmapService;
            _smartInsights = smartInsights;
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

        /// <summary>
        /// Analizlerim sol sütunu: gelecek ay tahmini (ML.NET SSA), anomali tespiti (ML.NET Randomized PCA + istatistik)
        /// ve tasarruf fırsatları (hesaplanan tutarlar + AI açıklaması). Sonuç veri değişene kadar önbellekte tutulur.
        /// </summary>
        [HttpGet("insights")]
        public async Task<IActionResult> GetInsights(CancellationToken cancellationToken)
        {
            var idClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
            return Ok(await _smartInsights.GetInsightsAsync(int.Parse(idClaim), cancellationToken));
        }

        /// <summary>Bir anomaliyi "normal" olarak işaretler; tekrar gösterilmez.</summary>
        [HttpPost("insights/anomalies/feedback")]
        public async Task<IActionResult> MarkAnomalyNormal([FromBody] AnomalyFeedbackRequest request)
        {
            var idClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
            var ok = await _smartInsights.MarkAnomalyAsNormalAsync(int.Parse(idClaim), request.Key ?? "");
            return ok ? NoContent() : NotFound(new { message = "Anomali bulunamadı." });
        }

        /// <summary>"Normal" işaretini geri alır.</summary>
        [HttpDelete("insights/anomalies/feedback")]
        public async Task<IActionResult> UnmarkAnomalyNormal([FromQuery] string key)
        {
            var idClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
            await _smartInsights.UnmarkAnomalyAsync(int.Parse(idClaim), key ?? "");
            return NoContent();
        }

        public sealed class AnomalyFeedbackRequest
        {
            public string? Key { get; set; }
        }

        /// <summary>Finansal yol haritası: öngörü kartları, yaşam tarzı skoru, nakit akışı tahmini, soru modülü (ML/istatistik).</summary>
        [HttpGet("roadmap")]
        public async Task<IActionResult> GetRoadmap(CancellationToken cancellationToken)
        {
            var idClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
            int userId = int.Parse(idClaim);

            var result = await _roadmapService.GetRoadmapAsync(userId, cancellationToken);
            return Ok(result);
        }
    }
}