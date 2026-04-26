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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Transaction>(e =>
            {
                e.Property(t => t.Amount).HasPrecision(18, 2);
                e.Property(t => t.PaymentMethod).HasMaxLength(128);
            });

            modelBuilder.Entity<FinanceSummary>(e =>
            {
                e.Property(x => x.Balance).HasPrecision(18, 2);
                e.Property(x => x.TotalExpense).HasPrecision(18, 2);
                e.Property(x => x.TotalIncome).HasPrecision(18, 2);
            });

            modelBuilder.Entity<Prediction>(e =>
            {
                e.Property(x => x.PredictedAmount).HasPrecision(18, 2);
            });

            modelBuilder.Entity<User>(e =>
            {
                e.Property(u => u.PasswordResetToken).HasMaxLength(128);
                e.Property(u => u.MonthlyIncomeNet).HasPrecision(18, 2);
                e.Property(u => u.MonthlyFixedCostsApprox).HasPrecision(18, 2);
            });
        }
    }
}
