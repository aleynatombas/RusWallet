namespace RusWallet.Core.DTOs.Transaction;

public class TransactionUpdateDto
{
    public decimal? Amount { get; set; }

    public int? CategoryId { get; set; }

    public string? PaymentMethod { get; set; }
}
