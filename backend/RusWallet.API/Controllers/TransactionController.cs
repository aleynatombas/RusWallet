using Microsoft.AspNetCore.Mvc;
using RusWallet.Core.DTOs.Transaction;
using RusWallet.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace RusWallet.API.Controllers
{
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransactionController : ControllerBase
{
    private readonly ITransactionService _transactionService;

    public TransactionController (ITransactionService transactionService)
    {
        _transactionService = transactionService;
    }

[HttpPost("add")]
public async Task<IActionResult> Add(TransactionCreateDto dto)
    {
        var idClaim = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
        int userId = int.Parse(idClaim);

        try
        {
            await _transactionService.AddTransactionAsync(userId, dto);
            return Ok();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

 [HttpGet]
 public async Task<IActionResult> Get([FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        var idClaim = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(idClaim)) return Unauthorized();
        int userId = int.Parse(idClaim);

        var result = await _transactionService.GetUserTransactionsAsync(userId, start, end);
        return Ok(result);
    }
}
}