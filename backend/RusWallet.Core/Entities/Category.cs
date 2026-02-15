namespace RusWallet.Core.Entities
{
    public class Category
    {
        public int CategoryId {get; set;}
        public string Name {get; set;} 
        public bool IsIncome {get; set;} 
        public int UserId { get; set; }
        public User User { get; set; }
        public ICollection<Transaction> Transactions { get; set; }


    }
}