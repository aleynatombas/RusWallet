using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using RusWallet.Core.Entities;
using RusWallet.Infrastructure.Security;

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
            // ── AES-256 Value Converter'lar ──────────────────────────────────
            // Veritabanında şifreli NVARCHAR(1024) olarak saklanır;
            // EF Core okurken otomatik çözer, yazarken otomatik şifreler.

            var decimalConv = new ValueConverter<decimal, string>(
                v => FieldEncryptionService.EncryptDecimal(v),
                v => FieldEncryptionService.DecryptDecimal(v));

            var nullableDecimalConv = new ValueConverter<decimal?, string?>(
                v => FieldEncryptionService.EncryptNullableDecimal(v),
                v => FieldEncryptionService.DecryptNullableDecimal(v));

            var stringConv = new ValueConverter<string, string>(
                v => FieldEncryptionService.Encrypt(v),
                v => FieldEncryptionService.Decrypt(v));

            var nullableStringConv = new ValueConverter<string?, string?>(
                v => FieldEncryptionService.EncryptNullableString(v),
                v => FieldEncryptionService.DecryptNullableString(v));

            // ── TRANSACTIONS ─────────────────────────────────────────────────
            modelBuilder.Entity<Transaction>(e =>
            {
                // Amount: işlem tutarı — şifreli NVARCHAR
                e.Property(t => t.Amount)
                 .HasConversion(decimalConv)
                 .HasColumnType("nvarchar(1024)");

                // Description: açıklama / mağaza adı — şifreli NVARCHAR
                e.Property(t => t.Description)
                 .HasConversion(stringConv)
                 .HasColumnType("nvarchar(1024)");

                // PaymentMethod: kart/banka adı — şifreli NVARCHAR
                e.Property(t => t.PaymentMethod)
                 .HasConversion(nullableStringConv)
                 .HasColumnType("nvarchar(1024)");
            });

            // ── FINANCE_SUMMARIES ────────────────────────────────────────────
            modelBuilder.Entity<FinanceSummary>(e =>
            {
                e.Property(x => x.TotalIncome)
                 .HasConversion(decimalConv)
                 .HasColumnType("nvarchar(1024)");

                e.Property(x => x.TotalExpense)
                 .HasConversion(decimalConv)
                 .HasColumnType("nvarchar(1024)");

                e.Property(x => x.Balance)
                 .HasConversion(decimalConv)
                 .HasColumnType("nvarchar(1024)");
            });

            // ── PREDICTIONS ──────────────────────────────────────────────────
            modelBuilder.Entity<Prediction>(e =>
            {
                e.Property(x => x.PredictedAmount)
                 .HasConversion(decimalConv)
                 .HasColumnType("nvarchar(1024)");
            });

            // ── USERS ────────────────────────────────────────────────────────
            modelBuilder.Entity<User>(e =>
            {
                e.Property(u => u.PasswordResetToken).HasMaxLength(128);

                // Aylık gelir / sabit gider tahmini — şifreli NVARCHAR
                e.Property(u => u.MonthlyIncomeNet)
                 .HasConversion(nullableDecimalConv)
                 .HasColumnType("nvarchar(1024)");

                e.Property(u => u.MonthlyFixedCostsApprox)
                 .HasConversion(nullableDecimalConv)
                 .HasColumnType("nvarchar(1024)");

                // Finansal profil JSON — şifreli NVARCHAR
                e.Property(u => u.FinancialProfileJson)
                 .HasConversion(nullableStringConv)
                 .HasColumnType("nvarchar(max)");
            });
        }
    }
}
