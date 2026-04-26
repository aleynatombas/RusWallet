using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RusWallet.Core.DTOs.AI;
using RusWallet.Core.Interfaces;

namespace RusWallet.API.Controllers
{
    /// <summary>
    /// Sabit soru-cevap chatbot. Web, Android ve iOS aynı endpoint'i kullanır.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatbotController : ControllerBase
    {
        private readonly IChatbotService _chatbotService;

        public ChatbotController(IChatbotService chatbotService)
        {
            _chatbotService = chatbotService;
        }

        /// <summary>Kullanıcı mesajına cevap döner (sabit sorular / FAQ).</summary>
        [HttpPost("ask")]
        public async Task<ActionResult<ChatResponseDto>> Ask([FromBody] ChatRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Message))
                return BadRequest("Message boş olamaz.");

            var idClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(idClaim) || !int.TryParse(idClaim, out var userId))
                return Unauthorized();

            var response = await _chatbotService.AskAsync(userId, dto.Message);
            return Ok(response);
        }
    }
}
