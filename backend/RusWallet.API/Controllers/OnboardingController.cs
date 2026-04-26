using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RusWallet.Core.DTOs.Onboarding;
using RusWallet.Core.Interfaces;

namespace RusWallet.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OnboardingController : ControllerBase
{
    private readonly IOnboardingService _onboarding;

    public OnboardingController(IOnboardingService onboarding)
    {
        _onboarding = onboarding;
    }

    [HttpGet("state")]
    public async Task<ActionResult<OnboardingStateDto>> GetState()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        var state = await _onboarding.GetStateAsync(userId.Value);
        return Ok(state);
    }

    public class OnboardingAnswerBody
    {
        public string Message { get; set; } = string.Empty;
    }

    [HttpPost("answer")]
    public async Task<ActionResult<OnboardingAnswerResponseDto>> Answer([FromBody] OnboardingAnswerBody body)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        if (string.IsNullOrWhiteSpace(body?.Message))
            return BadRequest(new { message = "Mesaj boş olamaz." });
        var res = await _onboarding.PostAnswerAsync(userId.Value, body.Message.Trim());
        return Ok(res);
    }

    [HttpPost("skip")]
    public async Task<IActionResult> Skip()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        await _onboarding.SkipAsync(userId.Value);
        return Ok(new { message = "Onboarding atlandı.", onboardingCompleted = true });
    }

    [HttpPost("reopen")]
    public async Task<IActionResult> Reopen()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        await _onboarding.ReopenAsync(userId.Value);
        return Ok(new { message = "Onboarding yeniden açıldı.", onboardingCompleted = false });
    }

    [HttpPost("abort-reopen")]
    public async Task<IActionResult> AbortReopen()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        await _onboarding.AbortReopenAsync(userId.Value);
        return Ok(new { message = "Güncelleme iptal edildi.", onboardingCompleted = true });
    }

    [HttpPatch("profile")]
    public Task<ActionResult<OnboardingStateDto>> PatchProfile([FromBody] OnboardingProfilePatchDto? body) =>
        UpdateProfileCore(body);

    /// <summary>Profil güncellemesi (POST — bazı proxy ortamlarında PATCH 404 verebildiği için).</summary>
    [HttpPost("update-profile")]
    public Task<ActionResult<OnboardingStateDto>> UpdateProfile([FromBody] OnboardingProfilePatchDto? body) =>
        UpdateProfileCore(body);

    private async Task<ActionResult<OnboardingStateDto>> UpdateProfileCore(OnboardingProfilePatchDto? body)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        if (body == null)
            return BadRequest(new { message = "Gövde boş olamaz." });
        if (body.MainGoal == null && !body.SavingsTargetAmount.HasValue)
            return BadRequest(new { message = "En az bir alan gönderin (mainGoal veya savingsTargetAmount)." });
        var state = await _onboarding.PatchProfileAsync(userId.Value, body);
        return Ok(state);
    }

    private int? GetUserId()
    {
        var idClaim = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(idClaim) || !int.TryParse(idClaim, out var id))
            return null;
        return id;
    }
}
