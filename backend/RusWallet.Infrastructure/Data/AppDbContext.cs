using Microsoft.EntityFrameworkCore;
using RusWallet.Core.Entities;

namespace RusWallet.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
            
        }
        public DbSet<User> Users { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<FinanceSummary> FinanceSummaries { get; set; }
        public DbSet<Prediction> Predictions { get; set; }

    }
}
