namespace RusWallet.Core.DTOs.Category
{
    public class CategoryCreateDto
    {
         public int UserId { get; set; }
        public string Name { get; set; } = null!;

        public bool IsIncome { get; set; }
    }
}
