using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using RusWallet.Core.Interfaces;
using RusWallet.Core.DTOs.Prediction;

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

        /// <summary>
        /// Harcama tahmini. period: 1week, 1month, 3months, 6months, all. Tarih girilmez; her zaman gelecek ay baz alınır.
        /// </summary>
        [HttpGet("monthly")]
        public async Task<IActionResult> GetMonthlyPrediction([FromQuery] string? period = "1month")
        {
            var idClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
            int userId = int.Parse(idClaim);

            var normalized = (period ?? "1month").Trim().ToLowerInvariant();
            if (normalized == "1hafta" || normalized == "1week") normalized = "1week";
            else if (normalized == "1ay" || normalized == "1month") normalized = "1month";
            else if (normalized == "3ay" || normalized == "3months") normalized = "3months";
            else if (normalized == "6ay" || normalized == "6months") normalized = "6months";
            else if (normalized == "tumu" || normalized == "tümü" || normalized == "all") normalized = "all";
            else normalized = "1month";

            var baseMonth = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1).AddMonths(1);

            if (normalized == "1week")
            {
                var oneMonth = await _predictionService.GetMonthlyPredictionAsync(userId, baseMonth);
                var daysInMonth = DateTime.DaysInMonth(baseMonth.Year, baseMonth.Month);
                var weekly = oneMonth.EstimatedAmount * 7m / daysInMonth;
                return Ok(new PredictionResponseDto
                {
                    EstimatedAmount = Math.Round(weekly, 2),
                    PredictedMonth = baseMonth,
                    Message = $"Önümüzdeki 1 hafta tahmini harcama: {Math.Round(weekly, 2)} TL."
                });
            }

            if (normalized == "1month")
            {
                var result = await _predictionService.GetMonthlyPredictionAsync(userId, baseMonth);
                return Ok(result);
            }

            int monthsToPredict = normalized == "3months" ? 3 : normalized == "6months" ? 6 : 12; // all => 12 ay
            decimal total = 0;
            var firstMonth = baseMonth;
            for (int i = 0; i < monthsToPredict; i++)
            {
                var m = baseMonth.AddMonths(i);
                var r = await _predictionService.GetMonthlyPredictionAsync(userId, m);
                total += r.EstimatedAmount;
                if (i == 0) firstMonth = r.PredictedMonth;
            }
            var periodLabel = normalized == "3months" ? "3 ay" : normalized == "6months" ? "6 ay" : "12 ay (tümü)";
            return Ok(new PredictionResponseDto
            {
                EstimatedAmount = Math.Round(total, 2),
                PredictedMonth = firstMonth,
                Message = $"Önümüzdeki {periodLabel} tahmini toplam harcama: {Math.Round(total, 2)} TL."
            });
        }
    }
}