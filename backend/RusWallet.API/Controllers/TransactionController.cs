using Microsoft.AspNetCore.Mvc;
using RusWallet.Core.DTOs.Transaction;
using RusWallet.Core.Interfaces;


[Route("api/[controller]")]
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
        int userId = int.Parse(User.FindFirst("id").Value);
        
        await _transactionService.AddTransactionAsync(userId, dto);
        return Ok();
    }

 [HttpGet]
 public async Task<IActionResult> Get([FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        int userId = int.Parse(User.FindFirst("id").Value);

        var result = await _transactionService.GetUserTransactionsAsync(userId);
        return Ok(result);

    }

}