using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RusWallet.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserMonthlyFinancialColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"IF COL_LENGTH('dbo.Users', 'MonthlyIncomeNet') IS NULL
                      ALTER TABLE [Users] ADD [MonthlyIncomeNet] decimal(18,2) NULL;
                  IF COL_LENGTH('dbo.Users', 'MonthlyFixedCostsApprox') IS NULL
                      ALTER TABLE [Users] ADD [MonthlyFixedCostsApprox] decimal(18,2) NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"IF COL_LENGTH('dbo.Users', 'MonthlyIncomeNet') IS NOT NULL
                      ALTER TABLE [Users] DROP COLUMN [MonthlyIncomeNet];
                  IF COL_LENGTH('dbo.Users', 'MonthlyFixedCostsApprox') IS NOT NULL
                      ALTER TABLE [Users] DROP COLUMN [MonthlyFixedCostsApprox];");
        }
    }
}
