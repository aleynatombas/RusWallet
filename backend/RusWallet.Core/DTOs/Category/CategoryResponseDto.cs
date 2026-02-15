namespace RusWallet.Core.DTOs.Category
{
    public class CategoryResponseDto
    {
        public int CategoryId { get; set; }

        public string Name { get; set; }= null!;

        public bool IsIncome { get; set; }
    }
}
