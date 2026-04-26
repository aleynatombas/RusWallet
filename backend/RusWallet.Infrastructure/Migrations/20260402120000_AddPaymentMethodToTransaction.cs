using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RusWallet.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentMethodToTransaction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"IF COL_LENGTH('dbo.Transactions', 'PaymentMethod') IS NULL
                      ALTER TABLE [Transactions] ADD [PaymentMethod] nvarchar(128) NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"IF COL_LENGTH('dbo.Transactions', 'PaymentMethod') IS NOT NULL
                      ALTER TABLE [Transactions] DROP COLUMN [PaymentMethod];");
        }
    }
}
